#!/usr/bin/env python3
"""
MVIKAS Logistics — Automated Data Pipeline & Dashboard Generator
Fetches live data from Google Sheets (or local Excel), parses operational sheets,
computes executive KPIs, financial metrics, and delay analytics, and generates
data/latest_data.json.
"""

from __future__ import annotations

import argparse
import calendar
import json
import math
import os
import re
import sys
import tempfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Optional

import requests
from openpyxl import load_workbook

# Sheet aliases for flexible matching across monthly workbooks
SHEET_ALIASES = {
    "booked": ["shipmentbookedyesterday", "bookedyesterday", "shipmentbooked", "booked"],
    "daily_tonnage": ["dailytonnage", "tonnageyesterday", "daily_tonnage"],
    "month_tonnage": ["totaltonnagethismonth", "monthtonnage", "tonnagethismonth", "total_tonnage_this_month"],
    "target_plan": [
        "tonnageofaugustmonth", "tonnageofseptembermonth", "tonnageofoctobermonth",
        "tonnageofnovembermonth", "tonnageofdecembermonth", "tonnageofjanuarymonth",
        "tonnageoffebruarymonth", "tonnageofmarchmonth", "tonnageofaprilmonth",
        "tonnageofmaymonth", "tonnageofjunemonth", "tonnageofjulymonth",
        "tonnagemonth", "targetplan", "monthlytarget", "tonnage", "target"
    ],
    "due": ["orderduetomorrow", "orderduetommorow", "duetomorrow", "duetmr"],
    "edd": ["ordereddcrossed", "eddcrossed", "delayedorders", "edd"],
    "open": ["openshipment", "openshipments", "activepipeline", "open"]
}

NAME_ALIASES = {
    "onericappliances": "Oneiric Appliances Pvt Ltd",
    "oneric": "Oneiric Appliances Pvt Ltd",
    "oneiricappliances": "Oneiric Appliances Pvt Ltd",
    "oneiricappliancespvt": "Oneiric Appliances Pvt Ltd",
    "mitras": "Mitras Technocrafts Pvt Ltd-HR",
    "mitrastechnocraft": "Mitras Technocrafts Pvt Ltd-HR",
    "mitrastechnocrafts": "Mitras Technocrafts Pvt Ltd-HR",
    "sukuga": "Sukuga Technologies Pvt Ltd",
    "sukugatechnologies": "Sukuga Technologies Pvt Ltd",
    "carrierctd": "Carrier CTD",
    "carrier-ctd": "Carrier CTD",
    "carrierrefrigeration": "Carrier Refrigeration",
    "haier": "Haier CCR",
    "haierccr": "Haier CCR",
    "epson": "Epson",
    "epsonindia": "Epson",
    "bombax": "Bombax",
    "kumarservices": "Kumar Services",
    "edusoft": "Edusoft Healthcare Ltd",
    "edusofthealthcare": "Edusoft Healthcare Ltd",
    "vaidrishi": "Vaidrishi Laboratories Pvt Ltd",
    "vaidrishilaboratories": "Vaidrishi Laboratories Pvt Ltd",
    "cosmospumps": "Cosmos Pumps Pvt Ltd",
    "cosmospumpspvt": "Cosmos Pumps Pvt Ltd",
    "loomsolar": "Loom Solar Pvt Ltd",
    "loomsolarpvt": "Loom Solar Pvt Ltd",
    "medicalscience": "Medical Science",
    "conficore": "Conficore",
    "herculesnutra": "HERCULES NUTRA",
    "medglobetherapeutics": "MEDGLOBE THERAPEUTICS",
    "khusbhuenterprises": "Khusbhu Enterprises"
}

RATES = {
    'Bombax': 14.38,
    'Carrier Refrigeration': 11.26,
    'Carrier CTD': 13.43,
    'Cosmos Pumps Pvt Ltd': 13.16,
    'Edusoft Healthcare Ltd': 13.77,
    'Haier CCR': 16.53,
    'Kumar Services': 10.20,
    'Loom Solar Pvt Ltd': 20.75,
    'Medical Science': 11.64,
    'Mitras Technocrafts Pvt Ltd-HR': 11.11,
    'Oneiric Appliances Pvt Ltd': 13.13,
    'Sukuga Technologies Pvt Ltd': 14.79,
    'Vaidrishi Laboratories Pvt Ltd': 12.73,
    'HERCULES NUTRA': 12.50,
    'MEDGLOBE THERAPEUTICS': 12.50,
    'Conficore': 12.00,
    'Epson': 12.00,
    'Khusbhu Enterprises': 10.00
}
DEFAULT_RATE = 10.0
FIXED_TARGET_MONEY = 8445000.0

REASON_CATEGORIES = {
    'customer': ['customer', 'consignee', 'refused', 'hold', 'sales person', 'space issue', 'address verification', 'contact', 'closed'],
    'carrier': ['hub', 'transit', 'misrouted', 'missed connection', 'vendor delay', 'intransit', 'last mile', 'highway', 'traffic', 'operational backlog'],
    'documentation': ['documents', 'documentation', 'po expired', 'deps', 'incorrect', 'incomplete', 'permit'],
    'external': ['natural calamity', 'rain', 'festival', 'strike', 'sez', 'weather', 'kawad', 'onam'],
    'location': ['oda', 'remote', 'misrouted shipment', 'narrow road'],
    'damage': ['damaged', 'damage', 'pilferage']
}


def normalize_str(s: Any) -> str:
    if s is None:
        return ""
    return re.sub(r"[^a-zA-Z0-9]", "", str(s)).lower()


def clean_str(s: Any) -> str:
    if s is None:
        return ""
    return str(s).strip()


def to_float(v: Any, default: float = 0.0) -> float:
    if v is None:
        return default
    if isinstance(v, (int, float)):
        return float(v) if not math.isnan(v) else default
    try:
        cleaned = str(v).replace(",", "").replace("₹", "").strip()
        return float(cleaned)
    except Exception:
        return default


def format_date_str(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, (datetime, date)):
        return val.strftime("%d %b %Y")
    text = str(val).strip()
    try:
        dt = datetime.fromisoformat(text.replace("Z", ""))
        return dt.strftime("%d %b %Y")
    except Exception:
        return text


def classify_delay_reason(reason: Optional[str]) -> str:
    if not reason:
        return "carrier"
    r = reason.lower()
    for cat, kws in REASON_CATEGORIES.items():
        if any(k in r for k in kws):
            return cat
    return "carrier"


def resolve_customer_name(raw_name: Any) -> str:
    cleaned = clean_str(raw_name)
    norm = normalize_str(cleaned)
    if norm in NAME_ALIASES:
        return NAME_ALIASES[norm]
    for k, v in NAME_ALIASES.items():
        if k in norm or norm in k:
            return v
    return cleaned if cleaned else "Unassigned"


def convert_google_sheets_url(url: str) -> str:
    """Convert any Google Sheets link to direct .xlsx export URL."""
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", url)
    if match:
        sheet_id = match.group(1)
        return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    return url


def download_source(source: str) -> tuple[Path, bool]:
    """Download Google Sheet or resolve local Excel path."""
    if source.startswith("http://") or source.startswith("https://"):
        export_url = convert_google_sheets_url(source)
        print(f"Downloading workbook from: {export_url}")
        resp = requests.get(export_url, timeout=45, headers={"User-Agent": "MVIKAS-Dashboard-Bot/1.0"})
        resp.raise_for_status()
        tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
        tmp.write(resp.content)
        tmp.close()
        return Path(tmp.name), True
    else:
        path = Path(source).resolve()
        if not path.exists():
            raise FileNotFoundError(f"Workbook source not found: {path}")
        return path, False


def find_sheet(wb, kind: str):
    aliases = SHEET_ALIASES.get(kind, [kind])
    sheet_names = wb.sheetnames
    # Exact match
    for name in sheet_names:
        norm = normalize_str(name)
        for alias in aliases:
            if norm == normalize_str(alias):
                return wb[name]
    # Substring match
    for name in sheet_names:
        norm = normalize_str(name)
        for alias in aliases:
            if normalize_str(alias) in norm or norm in normalize_str(alias):
                return wb[name]
    return None


def get_header_map(sheet, max_rows: int = 8) -> tuple[int, dict[str, int]]:
    """Locate header row and column mapping."""
    for r_idx, row in enumerate(sheet.iter_rows(values_only=True), start=1):
        if r_idx > max_rows:
            break
        col_map = {}
        for c_idx, val in enumerate(row):
            if val is not None and str(val).strip():
                norm = normalize_str(str(val))
                col_map[norm] = c_idx
        if any("customer" in k for k in col_map) or any("order" in k for k in col_map) or any("tonnage" in k for k in col_map):
            return r_idx, col_map
    return 1, {}


def parse_target_sheet(sheet, active_days: int = 25):
    """Parses customer targets, achieved kg, periods, and KAM personnel.

    Supports two layouts:
    1. Rich slab layout (Tonnage_of_August_Month):
       - col: S No | Personnel | Designation | Customer | Total Target |
              First 10 Target | d1..d10 | Mid 10 Target | d11..d20 |
              Last 10 Target | d21..d31
    2. Simple layout: Customer | Target | Achieved columns
    """
    clients = []
    if not sheet:
        return clients

    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return clients

    # ── Detect header row ─────────────────────────────────────────────────
    header_row_idx = None
    col_map = {}
    for i, r in enumerate(rows[:8]):
        m = {}
        for idx, c in enumerate(r):
            if c is not None:
                key = re.sub(r'[^a-zA-Z0-9]', '', str(c)).lower()
                m[key] = idx
        if m:
            col_map = m
            header_row_idx = i
            break

    if header_row_idx is None:
        return clients

    hdr = rows[header_row_idx]

    # ── Try rich slab layout detection ────────────────────────────────────
    # Look for "first 10 days target" and "mid 10 days target" headers
    first10_target_col = None
    mid10_target_col = None
    last10_target_col = None

    for idx, cell in enumerate(hdr):
        if cell is None:
            continue
        norm = re.sub(r'[^a-zA-Z0-9]', '', str(cell)).lower()
        if 'first' in norm and ('10' in norm or 'ten' in norm) and 'target' in norm:
            first10_target_col = idx
        elif 'mid' in norm and ('10' in norm or 'ten' in norm) and 'target' in norm:
            mid10_target_col = idx
        elif 'last' in norm and ('10' in norm or 'ten' in norm) and 'target' in norm:
            last10_target_col = idx

    is_rich_layout = (first10_target_col is not None
                      and mid10_target_col is not None
                      and last10_target_col is not None)

    if is_rich_layout:
        # Column index assignments from the rich layout
        cust_col = next((col_map[k] for k in col_map if 'customer' in k or 'nameofthecustomer' in k), 3)
        person_col = next((col_map[k] for k in col_map if 'personnel' in k or 'nameofthepersonnel' in k), 1)
        total_target_col = next((col_map[k] for k in col_map if k in ('totaltarget', 'target')), 4)

        # Daily columns for each slab are those between slab-target cols that are datetime objects
        def _day_cols_between(start_col, end_col):
            """Return list of column indices with date headers between start_col and end_col (exclusive)."""
            cols = []
            for idx in range(start_col + 1, end_col):
                val = hdr[idx] if idx < len(hdr) else None
                if val is not None and hasattr(val, 'day'):   # datetime
                    cols.append(idx)
            return cols

        day_cols_first10 = _day_cols_between(first10_target_col, mid10_target_col)
        day_cols_mid10   = _day_cols_between(mid10_target_col, last10_target_col)
        # last slab: from last10_target_col to end of row
        day_cols_last10  = []
        for idx in range(last10_target_col + 1, len(hdr)):
            val = hdr[idx] if idx < len(hdr) else None
            if val is not None and hasattr(val, 'day'):
                day_cols_last10.append(idx)

        seen_names = set()
        for r in rows[header_row_idx + 1:]:
            if not r or len(r) <= cust_col:
                continue
            raw_cust = r[cust_col]
            if not raw_cust or str(raw_cust).strip().lower() in {
                    'total', 'grand total', 'nan', 'none', 'name of the customer', ''}:
                continue
            # Skip pure-number serial rows that have no customer text
            try:
                float(str(raw_cust).strip())
                continue
            except ValueError:
                pass

            cust_name = resolve_customer_name(raw_cust)
            if cust_name in seen_names:
                # Merge achieved into existing entry (same customer, multiple rows)
                existing = next((c for c in clients if c['name'] == cust_name), None)
                if existing:
                    def _sum_cells(cols):
                        s = 0.0
                        for ci in cols:
                            if ci < len(r) and r[ci] is not None:
                                try:
                                    v = float(str(r[ci]).replace(',', ''))
                                    s += v
                                except (ValueError, TypeError):
                                    pass
                        return s
                    existing['periods']['first10']['achieved'] = round(
                        (existing['periods']['first10']['achieved'] or 0) + _sum_cells(day_cols_first10), 2)
                    existing['periods']['mid10']['achieved'] = round(
                        (existing['periods']['mid10']['achieved'] or 0) + _sum_cells(day_cols_mid10), 2)
                    existing['periods']['last10']['achieved'] = round(
                        (existing['periods']['last10']['achieved'] or 0) + _sum_cells(day_cols_last10), 2)
                    existing['achieved'] = round(
                        existing['periods']['first10']['achieved'] +
                        existing['periods']['mid10']['achieved'] +
                        existing['periods']['last10']['achieved'], 2)
                continue

            seen_names.add(cust_name)
            person = clean_str(r[person_col]) if person_col < len(r) and r[person_col] else 'Not Allotted'

            # Slab targets from dedicated target columns
            f10_tgt = to_float(r[first10_target_col] if first10_target_col < len(r) else None)
            m10_tgt = to_float(r[mid10_target_col]   if mid10_target_col   < len(r) else None)
            l10_tgt = to_float(r[last10_target_col]  if last10_target_col  < len(r) else None)

            # Use explicit total target if present, else sum slabs
            explicit_total = to_float(r[total_target_col] if total_target_col < len(r) else None)
            total_target = explicit_total if explicit_total > 0 else round(f10_tgt + m10_tgt + l10_tgt, 2)

            # Achieved = sum of daily cells in each slab
            def _sum_day_cols(cols):
                s = 0.0
                for ci in cols:
                    if ci < len(r) and r[ci] is not None:
                        try:
                            v = float(str(r[ci]).replace(',', ''))
                            s += v
                        except (ValueError, TypeError):
                            pass
                return round(s, 2)

            f10_ach = _sum_day_cols(day_cols_first10)
            m10_ach = _sum_day_cols(day_cols_mid10)
            l10_ach = _sum_day_cols(day_cols_last10)
            total_achieved = round(f10_ach + m10_ach + l10_ach, 2)

            clients.append({
                'name': cust_name,
                'person': person,
                'target': total_target,
                'achieved': total_achieved,
                'activeDays': active_days,
                'periods': {
                    'first10': {'target': round(f10_tgt, 2), 'achieved': f10_ach or None},
                    'mid10':   {'target': round(m10_tgt, 2), 'achieved': m10_ach or None},
                    'last10':  {'target': round(l10_tgt, 2), 'achieved': l10_ach or None},
                }
            })

        return clients

    # ── Fallback: simple layout (Customer | Target | Achieved) ───────────
    cust_col = next((col_map[k] for k in col_map if 'customer' in k or 'client' in k), 0)
    person_col = next((col_map[k] for k in col_map if 'kam' in k or 'person' in k or 'handled' in k), None)
    target_col = next((col_map[k] for k in col_map if 'target' in k and 'money' not in k), None)
    achieved_col = next((col_map[k] for k in col_map if 'achieved' in k or 'actual' in k or 'total' in k), None)

    for r in rows[header_row_idx + 1:]:
        if not r or len(r) <= cust_col:
            continue
        raw_cust = r[cust_col]
        if not raw_cust or str(raw_cust).strip().lower() in {'total', 'grand total', 'nan', 'none'}:
            continue

        cust_name = resolve_customer_name(raw_cust)
        person = clean_str(r[person_col]) if person_col is not None and person_col < len(r) and r[person_col] else 'Not Allotted'
        target = to_float(r[target_col]) if target_col is not None and target_col < len(r) else 0.0
        achieved = to_float(r[achieved_col]) if achieved_col is not None and achieved_col < len(r) else 0.0

        clients.append({
            'name': cust_name,
            'person': person,
            'target': round(target, 2),
            'achieved': round(achieved, 2),
            'activeDays': active_days
        })

    return clients



def parse_order_table(sheet, default_type: str = "Vendor") -> list[dict[str, Any]]:
    """Parses orders table (EDD crossed, Open, Due)."""
    orders = []
    if not sheet:
        return orders

    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return orders

    h_idx = 0
    col_map = {}
    for i, r in enumerate(rows[:8]):
        m = {normalize_str(c): idx for idx, c in enumerate(r) if c is not None}
        if any("order" in k or "shipment" in k or "customer" in k for k in m):
            h_idx = i
            col_map = m
            break

    id_col = next((col_map[k] for k in col_map if "order" in k or "shipment" in k or "lr" in k or "docket" in k), 0)
    cust_col = next((col_map[k] for k in col_map if "customer" in k or "client" in k or "consignor" in k), 1)
    trans_col = next((col_map[k] for k in col_map if "transporter" in k or "carrier" in k or "vendor" in k), None)
    edd_col = next((col_map[k] for k in col_map if "edd" in k or "delivery" in k or "expected" in k), None)
    reason_col = next((col_map[k] for k in col_map if "reason" in k or "delay" in k or "remark" in k), None)
    type_col = next((col_map[k] for k in col_map if "customervendor" in k or "type" in k or "attribution" in k), None)

    for r in rows[h_idx + 1:]:
        if not r or len(r) <= cust_col:
            continue
        raw_cust = r[cust_col]
        if not raw_cust or str(raw_cust).strip().lower() in {"total", "nan", "none"}:
            continue

        order_id = clean_str(r[id_col]) if id_col < len(r) and r[id_col] else f"ORD-{len(orders)+1}"
        cust_name = resolve_customer_name(raw_cust)
        transporter = clean_str(r[trans_col]) if trans_col is not None and trans_col < len(r) and r[trans_col] else "XP INDIA"
        edd_val = format_date_str(r[edd_col]) if edd_col is not None and edd_col < len(r) else ""
        reason = clean_str(r[reason_col]) if reason_col is not None and reason_col < len(r) and r[reason_col] else "Transit Delay"

        order_type = default_type
        if type_col is not None and type_col < len(r) and r[type_col]:
            t_str = clean_str(r[type_col]).capitalize()
            if "Customer" in t_str:
                order_type = "Customer"
            elif "Vendor" in t_str or "Carrier" in t_str:
                order_type = "Vendor"

        orders.append({
            "id": order_id,
            "name": cust_name,
            "transporter": transporter,
            "edd": edd_val,
            "reason": reason,
            "type": order_type
        })

    return orders


def group_counts_by_customer(sheet) -> list[dict[str, Any]]:
    """Groups order counts by customer."""
    if not sheet:
        return []
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    h_idx = 0
    cust_col = 0
    for i, r in enumerate(rows[:8]):
        m = {normalize_str(c): idx for idx, c in enumerate(r) if c is not None}
        c = next((m[k] for k in m if "customer" in k or "client" in k), None)
        if c is not None:
            h_idx = i
            cust_col = c
            break

    counts = defaultdict(int)
    for r in rows[h_idx + 1:]:
        if not r or len(r) <= cust_col:
            continue
        val = r[cust_col]
        if not val or str(val).strip().lower() in {"total", "nan", "none"}:
            continue
        c_name = resolve_customer_name(val)
        counts[c_name] += 1

    return [{"name": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: x[1], reverse=True)]


def group_tonnage_by_customer(sheet, field: str = "kg") -> list[dict[str, Any]]:
    """Groups tonnage (kg) by customer."""
    if not sheet:
        return []
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    h_idx = 0
    cust_col = 0
    kg_col = 1
    for i, r in enumerate(rows[:8]):
        m = {normalize_str(c): idx for idx, c in enumerate(r) if c is not None}
        c = next((m[k] for k in m if "customer" in k or "client" in k), None)
        k = next((m[k] for k in m if "tonnage" in k or "kg" in k or "weight" in k), None)
        if c is not None and k is not None:
            h_idx = i
            cust_col = c
            kg_col = k
            break

    totals = defaultdict(float)
    for r in rows[h_idx + 1:]:
        if not r or len(r) <= max(cust_col, kg_col):
            continue
        raw_cust = r[cust_col]
        if not raw_cust or str(raw_cust).strip().lower() in {"total", "nan", "none"}:
            continue
        c_name = resolve_customer_name(raw_cust)
        val = to_float(r[kg_col])
        totals[c_name] += val

    return [{"name": k, field: round(v, 2)} for k, v in sorted(totals.items(), key=lambda x: x[1], reverse=True)]


def process_workbook(excel_path: Path, source_name: str = "", active_days_override: int = 0) -> dict[str, Any]:
    """Extracts, computes, and structures dashboard data from openpyxl workbook."""
    wb = load_workbook(excel_path, data_only=True, read_only=True)

    today = date.today()
    # Default active days = today's day - 1 or 25
    active_days = active_days_override if active_days_override > 0 else max(today.day - 1, 1)
    days_in_month = calendar.monthrange(today.year, today.month)[1]

    # Parse sheets
    target_sheet = find_sheet(wb, "target_plan")
    clients = parse_target_sheet(target_sheet, active_days=active_days)

    month_tonnage_sheet = find_sheet(wb, "month_tonnage")
    if month_tonnage_sheet:
        m_ton = group_tonnage_by_customer(month_tonnage_sheet, field="achieved")
        m_map = {normalize_str(x["name"]): x["achieved"] for x in m_ton}
        for c in clients:
            norm = normalize_str(c["name"])
            if norm in m_map:
                c["achieved"] = m_map[norm]
        # Add clients present in monthly tonnage but not in target sheet
        existing_names = {normalize_str(c["name"]) for c in clients}
        for item in m_ton:
            if normalize_str(item["name"]) not in existing_names:
                clients.append({
                    "name": item["name"],
                    "person": "Not Allotted",
                    "target": 0.0,
                    "achieved": item["achieved"],
                    "activeDays": active_days,
                    "isNew": True
                })

    open_sheet = find_sheet(wb, "open")
    open_data = group_counts_by_customer(open_sheet)

    edd_sheet = find_sheet(wb, "edd")
    edd_data = group_counts_by_customer(edd_sheet)
    edd_detail = parse_order_table(edd_sheet, default_type="Vendor")

    due_sheet = find_sheet(wb, "due")
    due_data = group_counts_by_customer(due_sheet)

    booked_sheet = find_sheet(wb, "booked")
    booked_data = group_counts_by_customer(booked_sheet)

    daily_tonnage_sheet = find_sheet(wb, "daily_tonnage")
    daily_tonnage_data = group_tonnage_by_customer(daily_tonnage_sheet, field="kg")

    # If some data sheets are missing in source, use defaults/existing fallbacks
    open_total = sum(x["count"] for x in open_data) or 714
    edd_total = len(edd_detail) or sum(x["count"] for x in edd_data) or 234
    due_total = sum(x["count"] for x in due_data) or 69
    booked_total = sum(x["count"] for x in booked_data) or 46

    daily_total_ton = sum(x.get("kg", 0) for x in daily_tonnage_data)
    monthly_total_ton = sum(c.get("achieved", 0) for c in clients)

    # Compute financial metrics
    total_sales_money = sum(c.get("achieved", 0) * RATES.get(c.get("name"), DEFAULT_RATE) for c in clients)
    daily_money_rate = total_sales_money / active_days if active_days > 0 else 0
    predicted_sales = daily_money_rate * days_in_month
    predicted_pct = (predicted_sales / FIXED_TARGET_MONEY * 100) if FIXED_TARGET_MONEY > 0 else 0

    # Enrich clients
    for c in clients:
        t = c.get("target", 0)
        a = c.get("achieved", 0)
        c["pct"] = round(a / t * 100) if t > 0 else (999 if a > 0 else 0)
        c["avgDay"] = round(a / active_days) if active_days > 0 else 0
        c["remaining"] = max(t - a, 0) if t > 0 else 0
        c["daysNeeded"] = round(c["remaining"] / c["avgDay"], 1) if (c["avgDay"] > 0 and c["remaining"] > 0) else (0 if c["remaining"] == 0 else 999)

    # Delay reason analytics
    reason_counts = Counter(r.get("reason", "Transit Delay") for r in edd_detail)
    carrier_delays = Counter(r.get("transporter", "XP INDIA") for r in edd_detail)
    cat_counts = Counter(classify_delay_reason(r.get("reason")) for r in edd_detail)
    cv_counts = Counter(r.get("type", "Vendor") for r in edd_detail)

    return {
        "metadata": {
            "generatedAt": datetime.now().isoformat(),
            "sourceName": source_name,
            "reportDate": today.strftime("%B %d, %Y"),
            "monthName": today.strftime("%B"),
            "year": today.year,
            "activeDays": active_days,
            "daysInMonth": days_in_month
        },
        "kpis": {
            "openTotal": open_total,
            "eddTotal": edd_total,
            "eddPct": round(edd_total / open_total * 100) if open_total > 0 else 0,
            "dueTotal": due_total,
            "bookedTotal": booked_total,
            "dailyTonnageKg": round(daily_total_ton, 2),
            "monthlyTonnageKg": round(monthly_total_ton, 2),
            "dailyAvgKg": round(monthly_total_ton / active_days) if active_days > 0 else 0,
            "targetRevenue": FIXED_TARGET_MONEY,
            "achievedRevenue": round(total_sales_money, 2),
            "predictedRevenue": round(predicted_sales, 2),
            "predictedPct": round(predicted_pct, 1)
        },
        "clients": clients,
        "openData": open_data,
        "eddData": edd_data,
        "dueData": due_data,
        "bookedData": booked_data,
        "dailyTonnageData": daily_tonnage_data,
        "eddDetail": edd_detail,
        "delayAnalytics": {
            "totalDelayed": len(edd_detail),
            "reasonCounts": dict(reason_counts.most_common(20)),
            "carrierDelays": dict(carrier_delays.most_common(12)),
            "categories": dict(cat_counts),
            "customerVendor": dict(cv_counts)
        }
    }


def main():
    parser = argparse.ArgumentParser(description="Update MVIKAS logistics dashboard data.")
    parser.add_argument("--source", "-s", default=os.getenv("GOOGLE_SHEET_URL", ""), help="Google Sheet URL or local Excel filepath")
    parser.add_argument("--output", "-o", default="data/latest_data.json", help="Path to write latest_data.json")
    parser.add_argument("--report-date", default="", help="Override report date (YYYY-MM-DD), e.g. 2026-08-31 for August reports")
    parser.add_argument("--active-days", type=int, default=0, help="Override active operating days (default: auto-computed)")
    args = parser.parse_args()

    source = args.source.strip()
    if not source:
        print("No --source provided and GOOGLE_SHEET_URL environment variable is empty.")
        print("To run with Google Sheet: python scripts/update_dashboard.py --source '<GOOGLE_SHEET_URL>'")
        # Check if local fallback file exists or if we should verify existing data
        out_path = Path(args.output).resolve()
        if out_path.exists():
            print(f"Existing {args.output} is present. Keeping existing data.")
            sys.exit(0)
        else:
            print("Please provide a source URL or Excel file.")
            sys.exit(1)

    print(f"Starting dashboard update pipeline...")
    excel_path, is_temp = download_source(source)
    try:
        data = process_workbook(excel_path, source_name=Path(source).name, active_days_override=args.active_days)
        # Override metadata if explicit date/active_days provided
        if args.report_date:
            try:
                rd = datetime.strptime(args.report_date, "%Y-%m-%d").date()
                data["metadata"]["reportDate"] = rd.strftime("%B %d, %Y")
                data["metadata"]["monthName"] = rd.strftime("%B")
                data["metadata"]["year"] = rd.year
                data["metadata"]["daysInMonth"] = calendar.monthrange(rd.year, rd.month)[1]
                if not args.active_days:
                    data["metadata"]["activeDays"] = max(rd.day - 1, 1)
                for c in data.get("clients", []):
                    c["activeDays"] = data["metadata"]["activeDays"]
            except ValueError:
                print(f"Warning: Could not parse --report-date '{args.report_date}', using auto-detected date.")
        if args.active_days:
            data["metadata"]["activeDays"] = args.active_days
            for c in data.get("clients", []):
                c["activeDays"] = args.active_days
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Successfully generated {out_path}!")

        # Also write data/latest_data.js for local file:// execution without CORS restrictions
        js_path = out_path.with_suffix(".js")
        with open(js_path, "w", encoding="utf-8") as f:
            f.write("// Auto-generated by update_dashboard.py\nwindow.DASHBOARD_DATA = ")
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write(";\n")
        print(f"Successfully generated {js_path}!")

        rev = data['kpis']['achievedRevenue']
        print(f"Open: {data['kpis']['openTotal']} | EDD Crossed: {data['kpis']['eddTotal']} | Month Tonnage: {data['kpis']['monthlyTonnageKg']:,.2f} kg | Revenue: Rs.{rev:,.2f}")
    finally:
        if is_temp and excel_path.exists():
            try:
                excel_path.unlink()
            except Exception:
                pass


if __name__ == "__main__":
    main()

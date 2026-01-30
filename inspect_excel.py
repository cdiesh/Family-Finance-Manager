import pandas as pd
import os

file_path = r"C:\Users\charl\Downloads\Master Financial Forcast (1).xlsx"

try:
    # Load the Excel file
    xl = pd.ExcelFile(file_path)
    print(f"Sheet names: {xl.sheet_names}")
    
    # Try to read the '2026' sheet to see headers
    if '2026' in xl.sheet_names:
        df = xl.parse('2026')
        print(f"\n--- '2026' Sheet rows 24-40 (Cols A-H) ---")
        # Print columns A through H to find amounts
        print(df.iloc[24:40, 0:8])
    else:
        print("'2025' sheet not found.")

except Exception as e:
    print(f"Error reading file: {e}")

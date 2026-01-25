import pandas as pd
import os

file_path = r"C:\Users\charl\Downloads\Master Financial Forcast (1).xlsx"

try:
    # Load the Excel file
    xl = pd.ExcelFile(file_path)
    print(f"Sheet names: {xl.sheet_names}")
    
    # Try to read the '2025' sheet to see headers
    if '2025' in xl.sheet_names:
        df = xl.parse('2025')
        print(f"\n--- '2025' Sheet Columns ---")
        print(df.columns.tolist())
        print("\n--- First 10 Rows ---")
        print(df.head(10))
    else:
        print("'2025' sheet not found.")

except Exception as e:
    print(f"Error reading file: {e}")

import pandas as pd
file_path = r"C:\Users\charl\Downloads\Master Financial Forcast (1).xlsx"
try:
    df = pd.read_excel(file_path, sheet_name='2026', header=None)
    print("--- Raw Grid Rows 20-45 ---\n")
    print(df.iloc[20:45, 0:10])
except Exception as e:
    print(e)

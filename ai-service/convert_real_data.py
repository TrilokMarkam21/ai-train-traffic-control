"""
Data Conversion Tool
====================
Convert your real railway data from various formats to the training CSV format.

Supported input formats:
  - Operating logs (train_id, station, arrival, delay)
  - JSON data (from APIs)
  - Excel files
  - Database exports

Usage:
    python convert_real_data.py --input your_data.csv --output railway_data.csv
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List
import argparse
import json


def convert_from_operating_logs(input_file: str, output_file: str) -> None:
    """
    Convert railway operating logs to training format.
    
    Expected input columns:
        - train_id: Train number
        - station: Station name
        - scheduled_arrival: Expected arrival time
        - actual_arrival: When it actually arrived
        - current_delay: How much delayed (minutes)
        - track_occupancy: 0-1 or 0-100
        - weather: 0-1 or text description
        - signal_status: 0, 1, 2 or text (green/yellow/red)
    
    Output columns:
        - traffic_density
        - weather_score
        - historical_delay
        - signal_status
        - delay_minutes
    """
    print(f"\n🔄 Converting operating logs from {input_file}...")
    
    df = pd.read_csv(input_file)
    print(f"Loaded {len(df)} records")
    
    # Map columns (adjust these to match your data)
    result = pd.DataFrame()
    
    # Traffic density from track occupancy
    if 'track_occupancy' in df.columns:
        occupancy = df['track_occupancy']
        # If it's 0-100 scale, convert to 0-1
        if occupancy.max() > 1:
            result['traffic_density'] = occupancy / 100
        else:
            result['traffic_density'] = occupancy
    else:
        print("  ⚠ No 'track_occupancy' column found, using default 0.5")
        result['traffic_density'] = 0.5
    
    # Weather score
    if 'weather' in df.columns:
        weather = df['weather']
        if isinstance(weather.iloc[0], str):
            # Text mapping
            weather_map = {
                'clear': 0.95, 'sunny': 0.90,
                'partly_cloudy': 0.80, 'cloudy': 0.70,
                'rainy': 0.50, 'heavy_rain': 0.30,
                'storm': 0.10, 'severe': 0.05
            }
            result['weather_score'] = weather.str.lower().map(weather_map).fillna(0.8)
        else:
            # Numeric - ensure 0-1 scale
            if weather.max() > 1:
                result['weather_score'] = weather / 100
            else:
                result['weather_score'] = weather
    else:
        print("  ⚠ No 'weather' column found, using default 0.8 (clear)")
        result['weather_score'] = 0.8
    
    # Historical delay
    if 'current_delay' in df.columns:
        result['historical_delay'] = df['current_delay'].clip(0, 120)
    elif 'delay_minutes' in df.columns:
        result['historical_delay'] = df['delay_minutes'].clip(0, 120)
    else:
        print("  ⚠ No delay column found, calculating from arrival times...")
        df['scheduled'] = pd.to_datetime(df['scheduled_arrival'])
        df['actual'] = pd.to_datetime(df['actual_arrival'])
        result['historical_delay'] = (
            (df['actual'] - df['scheduled']).dt.total_seconds() / 60
        ).clip(0, 120)
    
    # Signal status
    if 'signal_status' in df.columns:
        signal = df['signal_status']
        if isinstance(signal.iloc[0], str):
            # Text mapping
            signal_map = {
                'green': 0, 'clear': 0,
                'yellow': 1, 'caution': 1, 'proceed_with_care': 1,
                'red': 2, 'stop': 2, 'restricted': 2
            }
            result['signal_status'] = signal.str.lower().map(signal_map).fillna(0).astype(int)
        else:
            result['signal_status'] = signal.astype(int).clip(0, 2)
    else:
        print("  ⚠ No 'signal_status' column found, inferring from traffic...")
        # Infer from traffic density
        result['signal_status'] = np.where(
            result['traffic_density'] >= 0.8, 2,
            np.where(result['traffic_density'] >= 0.5, 1, 0)
        )
    
    # Target: delay_minutes
    if 'delay_minutes' in df.columns:
        result['delay_minutes'] = df['delay_minutes'].clip(0, df['delay_minutes'].quantile(0.99))
    elif 'current_delay' in df.columns:
        result['delay_minutes'] = df['current_delay'].clip(0, df['current_delay'].quantile(0.99))
    else:
        print("  ⚠ No delay_minutes column found!")
        return None
    
    # Validate
    print(f"\n✓ Converted {len(result)} records")
    print(f"  traffic_density: {result['traffic_density'].min():.2f} - {result['traffic_density'].max():.2f}")
    print(f"  weather_score: {result['weather_score'].min():.2f} - {result['weather_score'].max():.2f}")
    print(f"  historical_delay: {result['historical_delay'].min():.1f} - {result['historical_delay'].max():.1f}")
    print(f"  signal_status: {sorted(result['signal_status'].unique())}")
    print(f"  delay_minutes: {result['delay_minutes'].min():.1f} - {result['delay_minutes'].max():.1f}")
    
    result.to_csv(output_file, index=False)
    print(f"\n✓ Saved to {output_file}")
    
    return result


def convert_from_json(input_file: str, output_file: str) -> None:
    """
    Convert JSON data (from API) to training format.
    
    Expected JSON structure:
    [
        {
            "traffic_density": 0.75,
            "weather_score": 0.8,
            "historical_delay": 12.0,
            "signal_status": 1,
            "delay_minutes": 18.5
        }
    ]
    """
    print(f"\n🔄 Converting JSON from {input_file}...")
    
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    required_cols = ['traffic_density', 'weather_score', 'historical_delay', 'signal_status', 'delay_minutes']
    
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        print(f"  ⚠ Missing columns: {missing}")
        return None
    
    df = df[required_cols]
    
    print(f"✓ Converted {len(df)} records")
    df.to_csv(output_file, index=False)
    print(f"✓ Saved to {output_file}")
    
    return df


def convert_from_excel(input_file: str, output_file: str, sheet_name: str = 0) -> None:
    """
    Convert Excel file to training format.
    """
    print(f"\n🔄 Converting Excel from {input_file}...")
    
    df = pd.read_excel(input_file, sheet_name=sheet_name)
    
    # Assume the same columns as operating logs
    convert_from_operating_logs(input_file, output_file)


def validate_output(csv_file: str) -> bool:
    """
    Validate that the output CSV is in the correct format.
    """
    print(f"\n✅ Validating {csv_file}...")
    
    df = pd.read_csv(csv_file)
    
    # Check columns
    required_cols = ['traffic_density', 'weather_score', 'historical_delay', 'signal_status', 'delay_minutes']
    for col in required_cols:
        if col not in df.columns:
            print(f"  ✗ Missing column: {col}")
            return False
    
    # Check ranges
    checks = [
        ('traffic_density', 0, 1),
        ('weather_score', 0, 1),
        ('historical_delay', 0, 120),
        ('delay_minutes', 0, 200),
    ]
    
    for col, min_val, max_val in checks:
        min_actual = df[col].min()
        max_actual = df[col].max()
        if min_actual < min_val or max_actual > max_val:
            print(f"  ⚠ {col}: {min_actual:.2f} - {max_actual:.2f} (expected {min_val} - {max_val})")
        else:
            print(f"  ✓ {col}: {min_actual:.2f} - {max_actual:.2f}")
    
    # Check signal status values
    signals = sorted(df['signal_status'].unique())
    if signals not in [[0], [0, 1], [0, 1, 2], [1, 2], [1], [2]]:
        print(f"  ⚠ signal_status values unusual: {signals}")
    else:
        print(f"  ✓ signal_status: {signals}")
    
    # Check for missing values
    missing = df.isnull().sum().sum()
    if missing > 0:
        print(f"  ✗ Found {missing} missing values!")
        return False
    else:
        print(f"  ✓ No missing values")
    
    print(f"\n✓ Validation passed! Ready for training with {len(df)} records")
    return True


def create_template_csv() -> None:
    """
    Create a template CSV file for users to fill in.
    """
    template = pd.DataFrame({
        'traffic_density': [0.75, 0.85, 0.2, 0.95, 0.5],
        'weather_score': [0.8, 0.6, 0.95, 0.2, 0.85],
        'historical_delay': [12.0, 8.0, 0.0, 25.0, 5.0],
        'signal_status': [1, 2, 0, 2, 1],
        'delay_minutes': [18.5, 22.3, 3.2, 68.1, 9.5]
    })
    
    template.to_csv('railway_data_template.csv', index=False)
    print("\n✓ Created railway_data_template.csv - edit this with your data!")


def main():
    parser = argparse.ArgumentParser(
        description="Convert real railway data to training format"
    )
    parser.add_argument('--input', '-i', help='Input file (CSV, JSON, or Excel)')
    parser.add_argument('--output', '-o', default='railway_data.csv', help='Output CSV file')
    parser.add_argument('--format', '-f', choices=['logs', 'json', 'excel'], 
                       help='Input format (auto-detect if not specified)')
    parser.add_argument('--template', action='store_true', help='Create template CSV')
    parser.add_argument('--validate', '-v', help='Validate output CSV')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("DATA CONVERSION TOOL")
    print("=" * 70)
    
    # Create template
    if args.template:
        create_template_csv()
        return
    
    # Validate existing file
    if args.validate:
        validate_output(args.validate)
        return
    
    # Convert file
    if not args.input:
        print("\n❌ Please specify --input file")
        parser.print_help()
        return
    
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"\n❌ Input file not found: {args.input}")
        return
    
    # Auto-detect format
    fmt = args.format
    if not fmt:
        ext = input_path.suffix.lower()
        if ext == '.csv':
            fmt = 'logs'
        elif ext == '.json':
            fmt = 'json'
        elif ext in ['.xlsx', '.xls']:
            fmt = 'excel'
        else:
            print(f"❌ Unknown file format: {ext}")
            return
    
    # Convert
    if fmt == 'logs':
        convert_from_operating_logs(args.input, args.output)
    elif fmt == 'json':
        convert_from_json(args.input, args.output)
    elif fmt == 'excel':
        convert_from_excel(args.input, args.output)
    
    # Validate output
    validate_output(args.output)


if __name__ == "__main__":
    main()

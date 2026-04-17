"""
Demand Prediction Engine for Blood Bank System
----------------------------------------------
Provides prediction models to forecast blood demand using historical daily usage data.
Supports Multiple Blood Types.

Dependencies:
    pandas, numpy, statsmodels, prophet (optional)
"""

import pandas as pd
import numpy as np
import warnings
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tools.sm_exceptions import ConvergenceWarning

try:
    from prophet import Prophet
except ImportError:
    Prophet = None

# Suppress harmless statmodels convergence warnings for cleaner output
warnings.simplefilter('ignore', ConvergenceWarning)

class DemandDataProcessor:
    """Handles data formatting and preparation for prediction."""
    
    @staticmethod
    def load_and_prepare(data):
        """
        Converts raw list of dictionaries into a clean Pandas DataFrame.
        Expected input format:
        [
            {"date": "2023-10-01", "blood_type": "A+", "units_used": 15, "event_flag": 0},
            ...
        ]
        """
        df = pd.DataFrame(data)
        if 'date' not in df.columns or 'blood_type' not in df.columns or 'units_used' not in df.columns:
            raise ValueError("Data must contain 'date', 'blood_type', and 'units_used' keys.")
            
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values(by=['blood_type', 'date'])
        df.set_index('date', inplace=True)
        return df

    @staticmethod
    def get_series_for_type(df, blood_type, target_col='units_used'):
        """Extracts the time series for a specific blood type, filling missing dates."""
        # asfreq('D') ensures we have a daily frequency; fillna(0) handles days with 0 usage recorded
        return df[df['blood_type'] == blood_type][target_col].asfreq('D').fillna(0)
    
    @staticmethod
    def get_dataframe_for_type(df, blood_type):
        """Extracts the full dataframe for a specific blood type (useful for Prophet regression)."""
        return df[df['blood_type'] == blood_type].asfreq('D').fillna(0)


class PredictionEngine:
    """Contains various forecasting algorithms for blood demand."""
    
    @staticmethod
    def moving_average_forecast(series, forecast_days=7, window=7):
        """
        Basic prediction using a Moving Average.
        Uses the last `window` days to predict the next `forecast_days` iteratively.
        """
        history = list(series.values)
        predictions = []
        for _ in range(forecast_days):
            next_val = np.mean(history[-window:])
            predictions.append(max(0, next_val)) # Demand cannot be negative
            history.append(next_val)
        return predictions

    @staticmethod
    def arima_forecast(series, forecast_days=7, order=(5, 1, 0)):
        """
        Advanced prediction using ARIMA model.
        Useful for univariate time series forecasting. Default order is (5,1,0).
        """
        try:
            model = ARIMA(series, order=order)
            model_fit = model.fit()
            forecast = model_fit.forecast(steps=forecast_days)
            return [max(0, val) for val in forecast.values]  # Ensure no negative predictions
        except Exception as e:
            print(f"ARIMA fitting failed: {e}. Falling back to Moving Average.")
            return PredictionEngine.moving_average_forecast(series, forecast_days)

    @staticmethod
    def prophet_forecast(df_type, forecast_days=7, external_features=None):
        """
        Advanced prediction using Facebook Prophet.
        Supports external regressors (features) like emergency events or day of the week.
        """
        if Prophet is None:
            raise ImportError("Prophet library is not installed. Please install it using 'pip install prophet'.")
            
        # Reset index to get historical dates into a 'ds' column, rename target to 'y'
        p_df = df_type.reset_index().rename(columns={'date': 'ds', 'units_used': 'y'})
        
        # Initialize Prophet (disable daily seasonality as our data is daily)
        model = Prophet(daily_seasonality=False) 
        
        # Bonus: Add external features if provided (e.g., is_weekend, event_flag)
        if external_features:
            for feature in external_features:
                if feature in p_df.columns:
                    model.add_regressor(feature)
        
        model.fit(p_df)
        
        # Create future dataframe for `forecast_days`
        future = model.make_future_dataframe(periods=forecast_days)
        
        # If external features exist, we need future values for them. 
        # For simplicity in this engine logic, we assume future boolean/flags hold 0 by default.
        # In a real deployment, the calling API must append external features to the future dates.
        if external_features:
            for feature in external_features:
                # Naive forward fill or 0 for future regressors
                future[feature] = 0 
                # If feature exists in historical data, populate it for history
                future.loc[:len(p_df)-1, feature] = p_df[feature].values
                
        forecast = model.predict(future)
        
        # Extract only the future prediction values
        future_preds = forecast['yhat'].tail(forecast_days).values
        return [max(0, val) for val in future_preds]


class DemandAnalyzer:
    """Analyzes prediction results to provide insights."""
    
    @staticmethod
    def calculate_trend(predictions):
        """
        Determines if the trend over the forecast period is increasing, decreasing, or stable.
        Uses a simple linear fit polynomial to check the slope.
        """
        if len(predictions) < 2:
            return "stable"
            
        x = np.arange(len(predictions))
        y = np.array(predictions)
        slope, _ = np.polyfit(x, y, 1)
        
        # Threshold for stability (e.g., +/- 0.5 units per day change over 7 days)
        if slope > 0.5:
            return "increasing"
        elif slope < -0.5:
            return "decreasing"
        else:
            return "stable"


def run_prediction_pipeline(raw_data, method='moving_average', forecast_days=7, external_features=None):
    """
    Main API to orchestrate the entire demand prediction pipeline for all blood types.
    
    Args:
        raw_data (list): List of dictionaries containing historical data.
        method (str): 'moving_average', 'arima', or 'prophet'.
        forecast_days (int): Number of days to predict into the future.
        external_features (list): List of column names to use as external features (Prophet only).
        
    Returns: 
        dict: Predicted demand per blood type along with trend and method used.
    """
    df = DemandDataProcessor.load_and_prepare(raw_data)
    blood_types = df['blood_type'].unique()
    
    results = {}
    
    for b_type in blood_types:
        series = DemandDataProcessor.get_series_for_type(df, b_type)
        df_type = DemandDataProcessor.get_dataframe_for_type(df, b_type)
        
        # Skip if there is insufficient historical data (e.g., less than the moving average window)
        if len(series) < 7:
            print(f"Warning: Not enough data points to forecast for {b_type}. Skipping.")
            continue
            
        # Select and execute prediction model
        try:
            if method == 'prophet' and Prophet is not None:
                preds = PredictionEngine.prophet_forecast(df_type, forecast_days, external_features)
            elif method == 'arima':
                preds = PredictionEngine.arima_forecast(series, forecast_days)
            else:
                preds = PredictionEngine.moving_average_forecast(series, forecast_days)
        except Exception as e:
            print(f"Error predicting for {b_type} using {method}: {e}. Skipping.")
            continue
            
        # Round the predictions (blood units are discrete integer items)
        preds_rounded = [int(round(p)) for p in preds]
        trend = DemandAnalyzer.calculate_trend(preds)
        
        results[b_type] = {
            "forecast_next_days": preds_rounded,
            "total_predicted_demand": sum(preds_rounded),
            "trend": trend,
            "method_used": method
        }
        
    return results


# =====================================================================
# Example usage / Test stub
# =====================================================================
if __name__ == "__main__":
    import random
    from datetime import datetime, timedelta
    
    # Generate Mock Data (30 days historical data for A+ and O-)
    print("Generating mock historical data for last 30 days...")
    start_date = datetime.today() - timedelta(days=30)
    mock_data = []
    
    for i in range(30):
        current_date = start_date + timedelta(days=i)
        is_weekend = 1 if current_date.weekday() >= 5 else 0
        
        # A+ random usage (Simulate higher demand on weekends)
        mock_data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "blood_type": "A+",
            "units_used": random.randint(10, 20) + (5 if is_weekend else 0),
            "is_weekend": is_weekend  # External feature for Prophet
        })
        
        # O- random usage (Simulate steady declining demand)
        mock_data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "blood_type": "O-",
            "units_used": max(0, 15 - (i // 3) + random.randint(-2, 2)), # Slowly goes down
            "is_weekend": is_weekend
        })
        
    print("\n--- Running Moving Average Simulation ---")
    results_ma = run_prediction_pipeline(mock_data, method='moving_average')
    for b_type, info in results_ma.items():
        print(f"[{b_type}] Average Method: {info}")
    
    print("\n--- Running ARIMA Strategy Simulation ---")
    results_arima = run_prediction_pipeline(mock_data, method='arima')
    for b_type, info in results_arima.items():
        print(f"[{b_type}] ARIMA Model: {info}")
        
    print("\n--- Note ---")
    print("To test Prophet predictions, install via: `pip install prophet`")
    print("Example: run_prediction_pipeline(mock_data, method='prophet', external_features=['is_weekend'])")

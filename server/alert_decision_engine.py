"""
Smart Alert and Decision Engine for Blood Bank Monitoring
---------------------------------------------------------
Monitors stock levels, cold chain temperatures, expiry dates, and emergency flags
to generate actionable alerts. Alerts are prioritized and managed using a Priority Queue.
"""

import heapq
from enum import IntEnum
from datetime import datetime

class PriorityLevel(IntEnum):
    """
    Defines severity levels. 
    Lower integer value = Higher priority in the queue.
    """
    EMERGENCY = 1
    HIGH = 2
    NORMAL = 3

class Alert:
    """Represents a single actionable alert in the system."""
    
    def __init__(self, priority: PriorityLevel, message: str, action: str, entity_id: str = None):
        self.priority = priority
        self.message = message
        self.action = action
        self.entity_id = entity_id
        # Use timestamp to maintain stable sorting for alerts with the same priority
        self.timestamp = datetime.now()

    def __lt__(self, other):
        """Allows heapq to compare Alerts based on Priority, then Timestamp."""
        if self.priority == other.priority:
            return self.timestamp < other.timestamp
        return self.priority < other.priority

    def to_dict(self):
        """Converts the alert to a dictionary for API json serialization."""
        return {
            "priority_level": self.priority.name,
            "severity_score": self.priority.value,
            "message": self.message,
            "recommended_action": self.action,
            "entity_id": self.entity_id,
        }

class AlertPriorityQueue:
    """Encapsulates priority queue logic for Alert management."""
    
    def __init__(self):
        self._queue = []

    def push(self, alert: Alert):
        heapq.heappush(self._queue, alert)

    def pop(self) -> Alert:
        if not self.is_empty():
            return heapq.heappop(self._queue)
        return None

    def is_empty(self) -> bool:
        return len(self._queue) == 0

    def get_ranked_alerts(self) -> list:
        """Destructively pops all alerts returning them ranked in priority order."""
        alerts = []
        while not self.is_empty():
            alerts.append(self.pop())
        return alerts

class DecisionEngine:
    """
    Core Engine handling business rules. Evaluates the blood bank state to generate alerts.
    """
    def __init__(self, low_stock_threshold: int = 20):
        self.low_stock_threshold = low_stock_threshold
        # Safe Temperature limits in celsius
        self.MIN_TEMP = 2.0
        self.MAX_TEMP = 6.0

    def evaluate_system_state(self, current_stocks: dict, blood_units: list, emergency_flag: bool = False):
        """
        Evaluates global parameters and unit-level parameters.
        
        Args:
            current_stocks (dict): Mapping of {blood_type: count}
            blood_units (list): List of dicts e.g. {"id": "U123", "temp_c": 4.5, "expiry": "2023-11-01"}
            emergency_flag (bool): True if an emergency situation is declared
            
        Returns:
            dict: Structured decision logic and warnings ready for an API.
        """
        queue = AlertPriorityQueue()
        unsafe_units = []
        prioritized_usage_units = []

        # 1. Emergency Override Rule (Overrides all priorities)
        if emergency_flag:
            queue.push(Alert(
                priority=PriorityLevel.EMERGENCY,
                message="EMERGENCY FLAG ACTIVATED",
                action="Override standard protocols. Dispatch available units immediately to emergency zones."
            ))

        # 2. Global Stock Evaluation
        for blood_type, count in current_stocks.items():
            if count < self.low_stock_threshold:
                # If emergency is active, low stock warning is heavily amplified
                prio = PriorityLevel.EMERGENCY if emergency_flag else PriorityLevel.HIGH
                queue.push(Alert(
                    priority=prio,
                    message=f"Low Stock Alert: {blood_type} is at {count} units.",
                    action=f"Initiate urgent blood drive or request {blood_type} from regional banks globally."
                ))

        # 3. Unit-Level Evaluation (Cold Chain & Expiry)
        now = datetime.now()
        for unit in blood_units:
            unit_id = unit.get("id")
            temp = unit.get("temp_c")
            expiry_str = unit.get("expiry")
            
            if not expiry_str:
                continue

            # Check Temperature Limits first (Safety first)
            is_unsafe = False
            if temp is not None:
                if temp < self.MIN_TEMP or temp > self.MAX_TEMP:
                    unsafe_units.append(unit_id)
                    is_unsafe = True
                    queue.push(Alert(
                        priority=PriorityLevel.HIGH,
                        message=f"Cold Chain Violation for unit {unit_id}. Temp recorded at {temp}°C.",
                        action="Mark unit as UNSAFE. Quarantine and halt distribution immediately.",
                        entity_id=unit_id
                    ))

            # If unit is already unsafe due to temp, skip expiry checking
            if is_unsafe:
                continue

            # Check Expiry Rule
            expiry_date = datetime.fromisoformat(expiry_str)
            days_to_expiry = (expiry_date - now).days
            
            if days_to_expiry < 0:
                unsafe_units.append(unit_id)
                queue.push(Alert(
                    priority=PriorityLevel.HIGH,
                    message=f"Unit {unit_id} has expired.",
                    action="Mark unit as UNSAFE and dispose of unit using biohazard protocols.",
                    entity_id=unit_id
                ))
            elif days_to_expiry <= 3:
                # Expiring soon (<3 days). Prioritize.
                prioritized_usage_units.append(unit_id)
                # If an emergency exists, utilizing dying units serves both purposes
                queue.push(Alert(
                    priority=PriorityLevel.NORMAL,
                    message=f"Unit {unit_id} expiring in {days_to_expiry} days.",
                    action=f"Route unit {unit_id} to top of the usage priority list to prevent discarding.",
                    entity_id=unit_id
                ))

        # Process Queue
        ranked_alerts = queue.get_ranked_alerts()
        
        # Calculate highest severity string
        overall_severity = PriorityLevel.NORMAL.name
        if ranked_alerts:
            overall_severity = ranked_alerts[0].priority.name

        return {
            "system_status": overall_severity,
            "alerts": [alert.to_dict() for alert in ranked_alerts],
            "unsafe_unit_ids": unsafe_units,
            "prioritized_unit_ids": prioritized_usage_units,
            "total_alerts": len(ranked_alerts)
        }


# ==============================================================================
# Simulation / API Testing Stub
# ==============================================================================
if __name__ == "__main__":
    from datetime import timedelta
    
    # Init Engine
    engine = DecisionEngine(low_stock_threshold=15)

    # Mock Data
    now = datetime.now()
    stocks = {
        "O-": 5,      # Triggers LOW STOCK
        "A+": 40,     # Normal
        "AB+": 12     # Triggers LOW STOCK
    }

    units = [
        # Normal Unit
        {"id": "U-101", "temp_c": 3.5, "expiry": (now + timedelta(days=20)).isoformat()},
        # Expiry < 3 days
        {"id": "U-102", "temp_c": 4.0, "expiry": (now + timedelta(days=2)).isoformat()},
        # Temperature Out Of Bounds
        {"id": "U-103", "temp_c": 8.0, "expiry": (now + timedelta(days=15)).isoformat()},
        # Expired Unit
        {"id": "U-104", "temp_c": 3.0, "expiry": (now - timedelta(days=1)).isoformat()}
    ]

    print("--- SCENARIO 1: Normal Operation ---")
    decision1 = engine.evaluate_system_state(stocks, units, emergency_flag=False)
    import json
    print(json.dumps(decision1, indent=2))
    
    print("\n--- SCENARIO 2: Emergency Simulation ---")
    decision2 = engine.evaluate_system_state(stocks, units, emergency_flag=True)
    print(json.dumps(decision2, indent=2))

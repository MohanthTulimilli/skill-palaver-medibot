# config.py

CLAIMS_PATH = "data/claims_400.csv"
INVOICES_PATH = "data/invoices_350.csv"
APPOINTMENTS_PATH = "data/appointments_250.csv"

MODEL_DIR = "model/"

DENIAL_MODEL_PATH = MODEL_DIR + "denial_model.pkl"
PAYMENT_MODEL_PATH = MODEL_DIR + "payment_delay_model.pkl"
NO_SHOW_MODEL_PATH = MODEL_DIR + "no_show_model.pkl"

DENIAL_PREPROCESSOR_PATH = MODEL_DIR + "denial_preprocessor.pkl"
PAYMENT_PREPROCESSOR_PATH = MODEL_DIR + "payment_preprocessor.pkl"
NO_SHOW_PREPROCESSOR_PATH = MODEL_DIR + "no_show_preprocessor.pkl"

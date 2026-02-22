# preprocess.py

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline


def create_preprocessor(df, target_column):
    X = df.drop(columns=[target_column], errors="ignore").copy()
    if "record_type" in X.columns:
        X = X.drop(columns=["record_type"])
    y = df[target_column]

    # Bool -> int for numeric; ensure categoricals are uniformly str
    for col in X.columns:
        if X[col].dtype.name == "bool":
            X[col] = X[col].astype(int)
        elif X[col].dtype.name == "string":
            X[col] = X[col].astype(object)
    # Convert categorical cols to string to avoid bool/str mix (e.g. preauthorization_obtained)
    numeric_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_features = X.select_dtypes(include=["object"]).columns.tolist()
    for col in categorical_features:
        X[col] = X[col].fillna("MISSING").astype(str)

    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="MISSING")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    transformers = []
    if numeric_features:
        transformers.append(("num", numeric_pipeline, numeric_features))
    if categorical_features:
        transformers.append(("cat", categorical_pipeline, categorical_features))

    preprocessor = ColumnTransformer(transformers) if transformers else None
    if preprocessor is None:
        raise ValueError("No numeric or categorical features found")
    return X, y, preprocessor

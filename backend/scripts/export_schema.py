from pathlib import Path

from app.schema import schema


def main() -> None:
    schema_path = Path(__file__).resolve().parents[1] / "schema.graphql"
    schema_path.write_text(schema.as_str(), encoding="utf-8")
    print(f"Wrote {schema_path}")


if __name__ == "__main__":
    main()

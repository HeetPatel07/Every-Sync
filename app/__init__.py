from flask import Flask
from .db import init_db

def create_app():
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static"
    )

    app.config["SECRET_KEY"] = "dev"

    init_db()

    from .routes import bp
    app.register_blueprint(bp)

    return app

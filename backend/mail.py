from fastapi_mail import FastMail,ConnectionConfig, MessageSchema, MessageType
import config


conf = ConnectionConfig(
    MAIL_USERNAME =config.MAIL_USERNAME,
    MAIL_PASSWORD =config.MAIL_PASSWORD,
    MAIL_FROM = config.Mail_FROM,
    MAIL_PORT = config.MAIL_PORT,
    MAIL_SERVER = config.MAIL_SERVER,
    MAIL_STARTTLS = False,
    MAIL_SSL_TLS = True,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)


mail=FastMail(config=conf)
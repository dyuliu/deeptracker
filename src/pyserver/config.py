# refert to http://flask.pocoo.org/docs/0.12/config/

class BaseConfig(object):
    DEBUG = False
    TESTING = False

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = True

class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False

class TestingConfig(BaseConfig):
    DEBUG = False
    TESTING = True

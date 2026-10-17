enum AppFlavor {
  dev,
  staging,
  prod;

  static AppFlavor fromString(String value) {
    switch (value.toLowerCase().trim()) {
      case 'staging':
        return AppFlavor.staging;
      case 'prod':
      case 'production':
        return AppFlavor.prod;
      case 'dev':
      case 'development':
      default:
        return AppFlavor.dev;
    }
  }

  bool get isDev => this == AppFlavor.dev;
  bool get isStaging => this == AppFlavor.staging;
  bool get isProd => this == AppFlavor.prod;
}

export class ValidateCredentialsQuery {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

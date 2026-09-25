export class CreateUserCommand {
  constructor(
    public readonly data: {
      nickName: string;
      email: string;
      passwordHash: string;
      person: {
        lastName: string;
        firstName: string;
        documentNumber: string;
        birthDate: string;
        phone: string;
      };
    },
  ) {}
}

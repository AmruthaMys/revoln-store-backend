export class UserEntity {
  id: string;
  email: string;
  name: string;
  // password hash should not be exposed

  createdAt: Date;
  updatedAt: Date;
}
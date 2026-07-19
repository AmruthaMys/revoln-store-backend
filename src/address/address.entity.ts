export class AddressEntity {
  id: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  userId: string;

  createdAt: Date;
  updatedAt: Date;
}
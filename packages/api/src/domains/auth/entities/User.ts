/**
 * User Domain Entity
 *
 * Simplified user entity for domain operations
 */

export interface UserProps {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private _id: string;
  private _name: string;
  private _email: string;
  private _emailVerified: boolean;
  private _image?: string;
  private _phone?: string;
  private _avatarUrl?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._name = props.name;
    this._email = props.email;
    this._emailVerified = props.emailVerified;
    this._image = props.image;
    this._phone = props.phone;
    this._avatarUrl = props.avatarUrl;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get emailVerified(): boolean { return this._emailVerified; }
  get image(): string | undefined { return this._image; }
  get phone(): string | undefined { return this._phone; }
  get avatarUrl(): string | undefined { return this._avatarUrl; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  toJSON(): UserProps {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      emailVerified: this._emailVerified,
      image: this._image,
      phone: this._phone,
      avatarUrl: this._avatarUrl,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
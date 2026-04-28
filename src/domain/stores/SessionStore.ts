import { makeAutoObservable } from 'mobx';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/**
 * Owns the session token. The backend treats any UUID as a valid user id,
 * so we generate one per session. When real auth ships, this is the place
 * to read/write the token from secure storage.
 */
export class SessionStore {
  token: string;

  constructor() {
    this.token = uuidv4();
    makeAutoObservable(this, { getToken: false }, { autoBind: true });
  }

  get getToken() {
    return this.token;
  }

  /** Reset for "logout" — generates a fresh anonymous identity. */
  rotate(): void {
    this.token = uuidv4();
  }
}

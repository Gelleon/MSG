
import { getUserDisplayName } from './utils';

describe('getUserDisplayName', () => {
  it('should return name if present', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com', username: 'john_d' };
    expect(getUserDisplayName(user)).toBe('John Doe');
  });

  it('should return username if name is missing', () => {
    const user = { id: '1', name: null, email: 'john@example.com', username: 'john_d' };
    expect(getUserDisplayName(user)).toBe('john_d');
  });

  it('should return email if name and username are missing', () => {
    const user = { id: '1', name: null, email: 'john@example.com', username: null };
    expect(getUserDisplayName(user)).toBe('john@example.com');
  });

  it('should return ID segment if all identifiers are missing', () => {
    const user = { id: '1234567890', name: null, email: null, username: null };
    expect(getUserDisplayName(user)).toBe('User 12345678');
  });

  it('should return ID segment from userId if id is missing', () => {
    const user = { userId: '1234567890', name: null, email: null, username: null };
    // @ts-ignore
    expect(getUserDisplayName(user)).toBe('User 12345678');
  });

  it('should return default string if user is null or undefined', () => {
    expect(getUserDisplayName(null)).toBe('Пользователь');
    expect(getUserDisplayName(undefined)).toBe('Пользователь');
  });

  it('should handle partial user object', () => {
    const user = { id: '1', email: 'test@example.com' };
    // @ts-ignore
    expect(getUserDisplayName(user)).toBe('test@example.com');
  });
});

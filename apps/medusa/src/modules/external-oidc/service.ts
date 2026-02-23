import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
} from '@medusajs/framework/types';
import { AbstractAuthModuleProvider } from '@medusajs/framework/utils';

export default class AuthProviderService extends AbstractAuthModuleProvider {
  static identifier = 'external';

  /**
   * For completion only. AuthProviderService should not be used programmatically
   * until this service is completely developed. We only need `external` identifier to be valid.
   *
   * @param data
   * @param authIdentityProviderService
   * @returns
   */
  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const isAuthenticated = false;

    // TODO perform custom logic to authenticate the user
    // for example, verifying a password

    if (!isAuthenticated) {
      // if the authentication didn't succeed, return
      // an object of the following format
      return {
        success: false,
        error: 'Incorrect credentials',
      };
    }

    // authentication is successful, retrieve the identity
    const authIdentity = await authIdentityProviderService.retrieve({
      entity_id: data?.body?.email ?? '', // email or some ID
    });

    return {
      success: true,
      authIdentity,
    };
  }
}

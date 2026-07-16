<?php

namespace App\Services;

use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\ProviderInterface;
use Laravel\Socialite\Two\User;

class KeycloakProvider extends AbstractProvider implements ProviderInterface
{
    protected $scopeSeparator = ' ';

    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase($this->getBaseUrl() . '/protocol/openid-connect/auth', $state);
    }

    protected function getTokenUrl()
    {
        return $this->getBaseUrl() . '/protocol/openid-connect/token';
    }

    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get($this->getBaseUrl() . '/protocol/openid-connect/userinfo', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
            ],
        ]);

        return json_decode($response->getBody(), true);
    }

    protected function mapUserToObject(array $user)
    {
        return (new User)->setRaw($user)->map([
            'id' => $user['sub'] ?? null,
            'nickname' => $user['preferred_username'] ?? null,
            'name' => $user['name'] ?? null,
            'email' => $user['email'] ?? null,
            'avatar' => null,
        ]);
    }

    protected function getBaseUrl()
    {
        $baseUrl = config('services.keycloak.base_url');
        $realm = config('services.keycloak.realms');
        return rtrim($baseUrl, '/') . '/realms/' . $realm;
    }
}

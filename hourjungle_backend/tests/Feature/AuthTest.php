<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Member;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user
        Member::create([
            'account' => 'testuser',
            'password' => Hash::make('password123'),
            'nickname' => 'Test User',
            'status' => 1,
            'email' => 'test@example.com',
        ]);
    }

    public function test_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'account' => 'testuser',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
                'message' => 'Login successful',
            ])
            ->assertJsonStructure([
                'data' => ['id', 'account', 'token'],
            ]);
    }

    public function test_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'account' => 'testuser',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => false,
            ]);
    }

    public function test_login_with_nonexistent_user(): void
    {
        $response = $this->postJson('/api/login', [
            'account' => 'nonexistent',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => false,
            ]);
    }

    public function test_logout(): void
    {
        // First login
        $loginResponse = $this->postJson('/api/login', [
            'account' => 'testuser',
            'password' => 'password123',
        ]);

        $member = Member::where('account', 'testuser')->first();

        $response = $this->postJson('/api/logout', [
            'id' => $member->id,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
            ]);
    }
}

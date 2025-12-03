<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Member;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class BranchTest extends TestCase
{
    use RefreshDatabase;

    protected $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test branch
        Branch::create([
            'id' => 1,
            'name' => 'Main Branch',
            'status' => 1,
        ]);

        // Create test user with token
        $member = Member::create([
            'account' => 'admin',
            'password' => Hash::make('password123'),
            'nickname' => 'Admin',
            'status' => 1,
            'token' => 'test-token-123',
            'branch_id' => 1,
        ]);

        $this->token = 'test-token-123';
    }

    public function test_get_branch_list(): void
    {
        $response = $this->getJson('/api/get-branch-list');

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'status'],
                ],
            ]);
    }

    public function test_create_branch_requires_auth(): void
    {
        $response = $this->postJson('/api/create-branch', [
            'name' => 'New Branch',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_branch_with_auth(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/create-branch', [
                'name' => 'New Branch',
                'status' => 1,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
            ]);

        $this->assertDatabaseHas('branches', [
            'name' => 'New Branch',
        ]);
    }

    public function test_create_branch_requires_name(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/create-branch', [
                'status' => 1,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => false,
            ]);
    }
}

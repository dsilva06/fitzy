<?php

namespace App\Http\Controllers;

use App\Enums\VenueStatus;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and issue an access token.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', Rule::in(['consumer', 'venue_admin', 'owner'])],
            'venue_id' => ['nullable', 'integer', 'exists:venues,id'],
            'venue_name' => ['nullable', 'string', 'max:255'],
            'venue_city' => ['nullable', 'string', 'max:255'],
            'venue_neighborhood' => ['nullable', 'string', 'max:255'],
            'venue_address' => ['nullable', 'string', 'max:255'],
            'venue_description' => ['nullable', 'string'],
            'device_name' => ['sometimes', 'string'],
        ]);

        $role = $data['role'] ?? 'consumer';
        $name = trim(sprintf('%s %s', $data['first_name'], $data['last_name']));

        if ($role === 'owner' && empty($data['venue_id'])) {
            throw ValidationException::withMessages([
                'venue_id' => ['El venue es obligatorio para este tipo de usuario.'],
            ]);
        }

        $venueId = $data['venue_id'] ?? null;

        if ($role === 'venue_admin') {
            $venueId = $this->resolveVenueForRegistration($data);
        }

        $user = User::create([
            'name' => $name !== '' ? $name : $data['email'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'profile_picture_url' => null,
            'role' => $role,
            'password' => Hash::make($data['password']),
            'venue_id' => $venueId,
        ]);

        $user->load('venue');

        if ($this->isPendingVenueAdmin($user)) {
            return $this->pendingApprovalResponse($user, 201);
        }

        $token = $user->createToken(
            $data['device_name'] ?? 'web-client',
            abilities: ['*']
        )->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    /**
     * Issue a Sanctum personal access token for the given credentials.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        if ($this->isPendingVenueAdmin($user)) {
            return $this->pendingApprovalResponse($user);
        }

        $token = $user->createToken(
            $credentials['device_name'] ?? 'user-device',
            abilities: ['*']
        )->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('venue'),
        ]);
    }

    /**
     * Return the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('venue'));
    }

    /**
     * Update profile information for the authenticated user.
     */
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'profile_picture_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $user->fill($data);

        if (array_key_exists('first_name', $data) || array_key_exists('last_name', $data)) {
            $user->name = trim(sprintf('%s %s', $user->first_name ?? '', $user->last_name ?? ''));
        }

        $user->save();

        return response()->json($user->fresh()->load('venue'));
    }

    /**
     * Revoke the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    private function resolveVenueForRegistration(array $data): int
    {
        if (! empty($data['venue_id'])) {
            $venue = Venue::find($data['venue_id']);

            if (! $venue) {
                throw ValidationException::withMessages([
                    'venue_id' => ['El venue seleccionado no existe.'],
                ]);
            }

            if ($venue->status !== VenueStatus::Approved->value) {
                throw ValidationException::withMessages([
                    'venue_id' => ['Este venue aún no está aprobado para nuevos administradores.'],
                ]);
            }

            return (int) $venue->id;
        }

        if (empty($data['venue_name'])) {
            throw ValidationException::withMessages([
                'venue_name' => ['Describe el nombre del venue para continuar.'],
            ]);
        }

        $venue = Venue::create([
            'name' => $data['venue_name'],
            'city' => $data['venue_city'] ?? null,
            'neighborhood' => $data['venue_neighborhood'] ?? null,
            'address' => $data['venue_address'] ?? null,
            'description' => $data['venue_description'] ?? null,
            'status' => VenueStatus::Pending->value,
        ]);

        return $venue->id;
    }

    private function isPendingVenueAdmin(User $user): bool
    {
        if ($user->role !== 'venue_admin') {
            return false;
        }

        $status = $user->venue?->status ?? null;

        return $status !== VenueStatus::Approved->value;
    }

    private function pendingApprovalResponse(User $user, ?int $overrideStatus = null): JsonResponse
    {
        $user->loadMissing('venue');
        $status = VenueStatus::tryFrom($user->venue?->status ?? '') ?? VenueStatus::Pending;
        $message = match ($status) {
            VenueStatus::Rejected => 'Tu registro fue rechazado. Revisa tu correo si necesitas más información.',
            default => 'Tu solicitud está en revisión. Te notificaremos cuando sea aprobada.',
        };

        $statusCode = $overrideStatus ?? ($status === VenueStatus::Rejected ? 403 : 423);

        return response()->json([
            'message' => $message,
            'status' => $status->value,
            'pending' => $status === VenueStatus::Pending,
            'user' => $user,
        ], $statusCode);
    }
}

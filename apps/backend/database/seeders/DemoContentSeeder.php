<?php

namespace Database\Seeders;

use App\Enums\VenueStatus;
use App\Models\Booking;
use App\Models\ClassSession;
use App\Models\ClassType;
use App\Models\Favorite;
use App\Models\Package;
use App\Models\PackageOwnership;
use App\Models\PaymentMethod;
use App\Models\Venue;
use App\Models\WaitlistEntry;
use App\Models\VenueInstructor;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DemoContentSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $owner = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'first_name' => 'Test',
                'last_name' => 'User',
                'phone' => '+1 555 0100',
                'role' => 'owner',
                'password' => Hash::make('password'),
            ]
        );

        $venuesData = [
            [
                'name' => 'Pulse Fitness Studio',
                'neighborhood' => 'Downtown',
                'city' => 'Caracas',
                'address' => '123 Main St',
                'rating' => 4.8,
                'logo_url' => null,
                'description' => 'High-energy fitness classes and personal training.',
            ],
            [
                'name' => 'Zen Yoga Loft',
                'neighborhood' => 'Altamira',
                'city' => 'Caracas',
                'address' => '456 Serenity Ave',
                'rating' => 4.9,
                'logo_url' => null,
                'description' => 'Boutique yoga loft focusing on mindfulness and mobility.',
            ],
            [
                'name' => 'Ride Revolution',
                'neighborhood' => 'Las Mercedes',
                'city' => 'Caracas',
                'address' => '789 Velocity Rd',
                'rating' => 4.7,
                'logo_url' => null,
                'description' => 'Immersive indoor cycling experience with live DJs.',
            ],
        ];

        $venues = collect($venuesData)->mapWithKeys(function (array $data) use ($owner) {
            $venue = Venue::updateOrCreate(
                ['name' => $data['name']],
                array_merge($data, ['status' => VenueStatus::Approved->value])
            );

            $venue->forceFill([
                'approved_at' => now(),
                'approved_by' => $owner->id,
            ])->save();

            return [$venue->name => $venue];
        });

        $owner->update([
            'venue_id' => $venues['Pulse Fitness Studio']->id,
        ]);

        $venueAdmin = User::firstOrCreate(
            ['email' => 'daniela@fitzy.demo'],
            [
                'name' => 'Daniela Santos',
                'first_name' => 'Daniela',
                'last_name' => 'Santos',
                'phone' => '+1 555 0190',
                'role' => 'venue_admin',
                'password' => Hash::make('password'),
                'venue_id' => $venues['Pulse Fitness Studio']->id,
            ]
        );

        $classTypesData = [
            ['name' => 'Yoga', 'description' => 'Mindful flows and breath work.'],
            ['name' => 'HIIT', 'description' => 'High intensity interval training.'],
            ['name' => 'Cycling', 'description' => 'Music-driven cycling sessions.'],
        ];

        $classTypes = collect($classTypesData)->mapWithKeys(function (array $data) {
            $type = ClassType::updateOrCreate(['name' => $data['name']], $data);
            return [$type->name => $type];
        });

        $packagesData = [
            [
                'name' => 'Unlimited Yoga Month',
                'description' => 'Unlimited yoga classes for 30 days.',
                'price' => 80,
                'credits' => 0,
                'validity_months' => 1,
                'category_name' => 'Yoga',
                'venue_id' => null,
            ],
            [
                'name' => 'HIIT 10-Pack',
                'description' => 'Bundle of 10 HIIT classes to use anytime.',
                'price' => 120,
                'credits' => 10,
                'validity_months' => 3,
                'category_name' => 'HIIT',
                'venue_id' => null,
            ],
            [
                'name' => 'Ride Revolution 5-Pack',
                'description' => 'Ride Revolution member exclusive pack.',
                'price' => 90,
                'credits' => 5,
                'validity_months' => 2,
                'category_name' => null,
                'venue_id' => $venues['Ride Revolution']->id,
            ],
        ];

        $packages = collect($packagesData)->mapWithKeys(function (array $data) {
            $package = Package::updateOrCreate(['name' => $data['name']], $data);
            return [$package->name => $package];
        });

        $instructorsData = [
            [
                'venue' => 'Pulse Fitness Studio',
                'name' => 'Lucía Fernández',
                'email' => 'lucia@fitzy.demo',
                'avatar_url' => 'https://api.dicebear.com/7.x/initials/svg?seed=LF&backgroundColor=5865F2&fontWeight=700',
            ],
            [
                'venue' => 'Pulse Fitness Studio',
                'name' => 'Carlos Méndez',
                'email' => 'carlos@fitzy.demo',
                'avatar_url' => 'https://api.dicebear.com/7.x/initials/svg?seed=CM&backgroundColor=22D3EE&fontWeight=700',
            ],
            [
                'venue' => 'Zen Yoga Loft',
                'name' => 'Sofía Rivas',
                'email' => 'sofia@fitzy.demo',
                'avatar_url' => 'https://api.dicebear.com/7.x/initials/svg?seed=SR&backgroundColor=4752C4&fontWeight=700',
            ],
        ];

        $instructors = collect($instructorsData)->mapWithKeys(function (array $data) use ($venues) {
            $instructor = VenueInstructor::updateOrCreate(
                [
                    'venue_id' => $venues[$data['venue']]->id,
                    'name' => $data['name'],
                ],
                [
                    'email' => $data['email'],
                    'avatar_url' => $data['avatar_url'],
                ]
            );

            return [$instructor->name => $instructor];
        });

        $start = Carbon::parse('2024-08-01 09:00:00', 'UTC');

        $sessionsData = [
            [
                'name' => 'Sunrise Vinyasa',
                'venue' => 'Zen Yoga Loft',
                'class_type' => 'Yoga',
                'start_offset' => 0,
                'duration_minutes' => 60,
                'coach_name' => 'Ana López',
                'instructor' => 'Sofía Rivas',
                'capacity_total' => 15,
                'capacity_taken' => 8,
                'price' => 18,
                'credit_cost' => 1,
                'level' => 'All Levels',
            ],
            [
                'name' => 'Power Flow',
                'venue' => 'Zen Yoga Loft',
                'class_type' => 'Yoga',
                'start_offset' => 4,
                'duration_minutes' => 60,
                'coach_name' => 'Carlos Medina',
                'instructor' => 'Sofía Rivas',
                'capacity_total' => 15,
                'capacity_taken' => 12,
                'price' => 18,
                'credit_cost' => 1,
                'level' => 'Intermediate',
            ],
            [
                'name' => 'Lunchtime HIIT',
                'venue' => 'Pulse Fitness Studio',
                'class_type' => 'HIIT',
                'start_offset' => 3,
                'duration_minutes' => 45,
                'coach_name' => 'Victoria Díaz',
                'instructor' => 'Lucía Fernández',
                'capacity_total' => 20,
                'capacity_taken' => 19,
                'price' => 22,
                'credit_cost' => 2,
                'level' => 'Advanced',
            ],
            [
                'name' => 'After Work Burn',
                'venue' => 'Pulse Fitness Studio',
                'class_type' => 'HIIT',
                'start_offset' => 10.5,
                'duration_minutes' => 45,
                'coach_name' => 'Miguel Torres',
                'instructor' => 'Carlos Méndez',
                'capacity_total' => 20,
                'capacity_taken' => 9,
                'price' => 22,
                'credit_cost' => 2,
                'level' => 'Intermediate',
            ],
            [
                'name' => 'Sunset Ride',
                'venue' => 'Ride Revolution',
                'class_type' => 'Cycling',
                'start_offset' => 11,
                'duration_minutes' => 50,
                'coach_name' => 'Valentina Rojas',
                'instructor' => null,
                'capacity_total' => 25,
                'capacity_taken' => 24,
                'price' => 25,
                'credit_cost' => 3,
                'level' => 'All Levels',
            ],
        ];

        $sessions = collect($sessionsData)->map(function (array $data) use ($start, $venues, $classTypes, $instructors) {
            $startAt = $start->copy()->addHours($data['start_offset']);
            $endAt = $startAt->copy()->addMinutes($data['duration_minutes']);

            return ClassSession::updateOrCreate(
                [
                    'name' => $data['name'],
                    'venue_id' => $venues[$data['venue']]->id,
                    'class_type_id' => $classTypes[$data['class_type']]->id,
                    'start_datetime' => $startAt,
                ],
                [
                    'end_datetime' => $endAt,
                    'coach_name' => $data['coach_name'],
                    'instructor_id' => $data['instructor']
                        ? $instructors[$data['instructor']]->id
                        : null,
                    'capacity_total' => $data['capacity_total'],
                    'capacity_taken' => $data['capacity_taken'],
                    'price' => $data['price'],
                    'credit_cost' => $data['credit_cost'],
                    'level' => $data['level'],
                ]
            );
        });

        PackageOwnership::updateOrCreate(
            [
                'user_id' => $owner->id,
                'package_id' => $packages['HIIT 10-Pack']->id,
            ],
            [
                'credits_total' => 10,
                'credits_remaining' => 6,
                'status' => 'active',
                'purchased_at' => Carbon::parse('2024-07-01 12:00:00', 'UTC'),
                'expires_at' => Carbon::parse('2024-10-01 12:00:00', 'UTC'),
            ]
        );

        PackageOwnership::updateOrCreate(
            [
                'user_id' => $owner->id,
                'package_id' => $packages['Unlimited Yoga Month']->id,
            ],
            [
                'credits_total' => 0,
                'credits_remaining' => 0,
                'status' => 'active',
                'purchased_at' => Carbon::parse('2024-07-15 12:00:00', 'UTC'),
                'expires_at' => Carbon::parse('2024-08-15 12:00:00', 'UTC'),
            ]
        );

        Booking::updateOrCreate(
            [
                'user_id' => $owner->id,
                'session_id' => $sessions[0]->id,
            ],
            [
                'status' => 'confirmed',
                'cancellation_deadline' => Carbon::parse('2024-08-01 07:00:00', 'UTC'),
            ]
        );

        Booking::updateOrCreate(
            [
                'user_id' => $owner->id,
                'session_id' => $sessions[2]->id,
            ],
            [
                'status' => 'confirmed',
                'cancellation_deadline' => Carbon::parse('2024-08-01 10:00:00', 'UTC'),
            ]
        );

        Favorite::updateOrCreate([
            'user_id' => $owner->id,
            'venue_id' => $venues['Zen Yoga Loft']->id,
        ]);

        Favorite::updateOrCreate([
            'user_id' => $owner->id,
            'venue_id' => $venues['Ride Revolution']->id,
        ]);

        WaitlistEntry::updateOrCreate(
            [
                'user_id' => $owner->id,
                'session_id' => $sessions[4]->id,
            ],
            [
                'status' => 'active',
            ]
        );

        PaymentMethod::updateOrCreate(
            [
                'user_id' => $owner->id,
                'type' => 'card',
                'masked_details' => '**** **** **** 1234',
            ],
            [
                'card_brand' => 'visa',
                'card_expiry' => '08/27',
                'is_default' => true,
            ]
        );

        PaymentMethod::updateOrCreate(
            [
                'user_id' => $owner->id,
                'type' => 'zelle',
                'email' => 'test@example.com',
            ],
            [
                'account_name' => 'Test User',
                'is_default' => false,
            ]
        );
    }
}

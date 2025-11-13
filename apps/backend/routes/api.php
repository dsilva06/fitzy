<?php

use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\ClassTypeController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PackageOwnershipController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\VenueInstructorController;
use App\Http\Controllers\Api\WaitlistEntryController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'update']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Public read-only endpoints
Route::get('venues', [VenueController::class, 'index']);
Route::get('venues/{venue}', [VenueController::class, 'show']);
Route::get('class-types', [ClassTypeController::class, 'index']);
Route::get('class-types/{classType}', [ClassTypeController::class, 'show']);
Route::get('sessions', [ClassSessionController::class, 'index']);
Route::get('sessions/{classSession}', [ClassSessionController::class, 'show']);
Route::get('packages', [PackageController::class, 'index']);
Route::get('packages/{package}', [PackageController::class, 'show']);
Route::get('instructors', [VenueInstructorController::class, 'index']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::apiResource('bookings', BookingController::class)->except(['create', 'edit']);
    Route::apiResource('package-ownerships', PackageOwnershipController::class)->except(['create', 'edit']);
    Route::apiResource('payment-methods', PaymentMethodController::class)->except(['create', 'edit']);
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('favorites', FavoriteController::class)->only(['index', 'store', 'destroy']);
    Route::apiResource('waitlist-entries', WaitlistEntryController::class)->except(['create', 'edit']);

    Route::middleware('role:owner,venue_admin')->group(function (): void {
        Route::post('venues', [VenueController::class, 'store']);
        Route::put('venues/{venue}', [VenueController::class, 'update']);
        Route::delete('venues/{venue}', [VenueController::class, 'destroy']);

        Route::post('instructors', [VenueInstructorController::class, 'store']);
        Route::put('instructors/{instructor}', [VenueInstructorController::class, 'update']);
        Route::delete('instructors/{instructor}', [VenueInstructorController::class, 'destroy']);

        Route::post('class-types', [ClassTypeController::class, 'store']);
        Route::put('class-types/{classType}', [ClassTypeController::class, 'update']);
        Route::delete('class-types/{classType}', [ClassTypeController::class, 'destroy']);

        Route::post('sessions', [ClassSessionController::class, 'store']);
        Route::put('sessions/{classSession}', [ClassSessionController::class, 'update']);
        Route::delete('sessions/{classSession}', [ClassSessionController::class, 'destroy']);

        Route::post('packages', [PackageController::class, 'store']);
        Route::put('packages/{package}', [PackageController::class, 'update']);
        Route::delete('packages/{package}', [PackageController::class, 'destroy']);
    });

    Route::middleware('role:owner')->group(function (): void {
        Route::post('venues/{venue}/approve', [VenueController::class, 'approve']);
        Route::post('venues/{venue}/reject', [VenueController::class, 'reject']);
    });
});

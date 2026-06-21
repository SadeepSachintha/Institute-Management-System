<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faculty extends Model
{
    protected $table = 'faculty';

    protected $fillable = ['user_id', 'qualifications', 'department', 'max_teaching_hours'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function timetables(): HasMany
    {
        return $this->hasMany(Timetable::class, 'faculty_id');
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'faculty_id');
    }
}

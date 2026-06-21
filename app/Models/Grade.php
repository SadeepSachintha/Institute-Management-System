<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    protected $fillable = [
        'student_id', 'subject_name', 'assessment_name',
        'marks_obtained', 'max_marks', 'weight'
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}

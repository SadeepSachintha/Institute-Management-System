<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fee extends Model
{
    protected $fillable = ['name', 'amount', 'due_date'];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}

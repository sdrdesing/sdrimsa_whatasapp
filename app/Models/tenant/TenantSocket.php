<?php
namespace App\Models\tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantSocket extends Model
{
    use HasFactory;

    protected $fillable = [
        'socket_channel',
    ];
}
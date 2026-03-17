import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const { userId, accessToken } = await req.json();
    if (!userId || !accessToken) {
      return NextResponse.json({ error: 'userId and accessToken required' }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller via access token
    const { data: { user: caller }, error: callerErr } = await adminClient.auth.getUser(accessToken);
    if (callerErr || !caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check caller is admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete in correct order respecting FK constraints
    await adminClient.from('dividend_calculations').delete().eq('owner_id', userId);
    await adminClient.from('property_shares').delete().eq('owner_id', userId);
    await adminClient.from('profiles').delete().eq('id', userId);

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

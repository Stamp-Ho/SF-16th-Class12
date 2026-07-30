'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/** 반 id 기반 노래 기록 불러오기 */
export async function getSongRecords(classId: number) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('song_records')
		.select('*')
		.eq('class_id', classId)
		.order('created_at', { ascending: false });
	if (error) {
		throw new Error(`노래 기록 조회 실패: ${error.message}`);
	}
	return data;
}

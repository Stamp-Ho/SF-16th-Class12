import { createClient } from '@/utils/supabase/server';
import LoginModal from '@/components/LoginModal';
import SongMain from './SongMain';

export default async function SongPage() {
	const supabase = await createClient();

	// 1. 현재 세션 유저 조회
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return <LoginModal />;
	}
	// 2. 로그인 유저의 profile (Role) 조회
	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();
	if (!profile || !profile.class_id) {
		return <div className="text-center text-red-500">권한이 없습니다.</div>;
	}
	return (
		<SongMain
			user={{
				name: profile.name,
				role: profile.role,
				classId: profile.class_id,
			}}
		/>
	);
}

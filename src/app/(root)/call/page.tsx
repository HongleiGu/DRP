// so the design is, when the user logins enter and confirms entering the app, this is the page they should join
// room id == chat id ==(in the furture)== call id

"use client";

import { useState } from "react";
import InstantMeeting from "@/components/MeetingPage/InstantMeeting";
import CreateLink from "@/components/MeetingPage/CreateLink";
import JoinMeeting from "@/components/MeetingPage/JoinMeeting";

export default function Dashboard() {
	const [startInstantMeeting, setStartInstantMeeting] =
		useState<boolean>(false);
	const [joinMeeting, setJoinMeeting] = useState<boolean>(false);
	const [showCreateLink, setShowCreateLink] = useState<boolean>(false);

	return (
		<>
			<button
				className=' top-5 right-5 text-sm fixed bg-green-500 px-2 w-[150px] hover:bg-green-600 py-3 flex flex-col items-center text-white rounded-md shadow-sm cursor-pointer z-10'
				onClick={() => setJoinMeeting(true)}
			>
				{/* <FaVideo className='mb-[3px] text-white' /> */}
				Join FaceTime
			</button>

			<main className='w-full h-screen flex flex-col items-center justify-center'>
				<h1 className='font-bold text-2xl text-center'>FaceTime</h1>

				<div className='flex items-center justify-center space-x-4 mt-6'>
					<button
						className='bg-gray-500 px-4 w-[200px] py-3 flex flex-col items-center hover:bg-gray-600 text-white rounded-md shadow-sm'
						onClick={() => setShowCreateLink(true)}
					>
						{/* <FaLink className='mb-[3px] text-gray-300'/> */}
						Create link
					</button>
					<button
						className='bg-green-500 px-4 w-[200px] hover:bg-green-600 py-3 flex flex-col items-center text-white rounded-md shadow-sm'
						onClick={() => setStartInstantMeeting(true)}
					>
						{/* <FaVideo className='mb-[3px] text-white'/> */}
						New FaceTime
					</button>
				</div>
			</main>

			{startInstantMeeting && (
				<InstantMeeting
					enable={startInstantMeeting}
					setEnable={setStartInstantMeeting}
				/>
			)}
			{showCreateLink && (
				<CreateLink enable={showCreateLink} setEnable={setShowCreateLink}/>
			)}
			{joinMeeting && (<JoinMeeting enable={joinMeeting} setEnable={setJoinMeeting}/>)}
		</>
	);
}
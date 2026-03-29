import React from 'react'
import ProjectView from '../../../modules/projects/components/project-view';

const Page = async ({ params }) => {
    const projectId = await params;
    return (
        <ProjectView projectId={projectId} />
    )
}

export default Page
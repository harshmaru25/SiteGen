import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query"
import {createProject, getProjectById, getProjects} from "../actions" 

export const useGetProjects = ()=>{
    return useQuery({
        queryKey:["projects"],
        queryFn:()=>getProjects()
    })
}

export const useCreateProject = ()=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:(value)=>createProject(value),
        onSuccess:()=>queryClient.invalidateQueries({queryKey:["projects"]})
    })
}

export const useGetProjectById = (ProjectId)=>{
    return useQuery({
        queryKey:["project",ProjectId],
        getProjectById:()=>getProjectById(ProjectId)
    })
}

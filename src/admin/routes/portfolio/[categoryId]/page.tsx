import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Table, Text, IconButton, toast, Switch } from "@medusajs/ui"
import { usePortfolioProjects, useDeleteProject, type PortfolioProject } from "../../../hooks/api/portfolio"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Trash, PencilSquare, ArrowLeft } from "@medusajs/icons"

const ProjectsListPage = () => {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = usePortfolioProjects(categoryId || "")
  const deleteProject = useDeleteProject()

  const handleToggleHomepage = async (project: PortfolioProject) => {
    const newValue = !project.is_in_homepage
    try {
      const response = await fetch(`/admin/portfolio/projects/${project.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_in_homepage: newValue }),
      })
      if (!response.ok) throw new Error("Failed to update project")
      toast.success(`Project ${newValue ? "added to" : "removed from"} homepage`)
      queryClient.setQueryData(["portfolio-projects", categoryId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          projects: old.projects.map((p: PortfolioProject) =>
            p.id === project.id ? { ...p, is_in_homepage: newValue } : p
          ),
        }
      })
    } catch (e) {
      toast.error("Failed to update project")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return
    try {
      await deleteProject.mutateAsync(id)
      toast.success("Project deleted")
    } catch (e) {
      toast.error("Failed to delete project")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center gap-2">
          <Button variant="transparent" size="small" onClick={() => navigate("/portfolio")}>
            <ArrowLeft />
          </Button>
          <Heading level="h1">Projects</Heading>
        </div>
        <div className="mt-4">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="flex items-center gap-2">
          <Button variant="transparent" size="small" onClick={() => navigate("/portfolio")}>
            <ArrowLeft />
          </Button>
          <Heading level="h1">Projects</Heading>
        </div>
        <div className="mt-4 text-ui-fg-error">Error loading projects</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="transparent" size="small" onClick={() => navigate("/portfolio")}>
            <ArrowLeft />
          </Button>
          <Heading level="h1">Projects</Heading>
        </div>
        <Button size="small" onClick={() => navigate(`/portfolio/${categoryId}/create`)}>
          Create Project
        </Button>
      </div>

      <div className="mt-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Hero Image</Table.HeaderCell>
              <Table.HeaderCell>Title (EN)</Table.HeaderCell>
              <Table.HeaderCell>Title (AR)</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Homepage</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.projects?.map((project: PortfolioProject) => (
              <Table.Row
                key={project.id}
                className="cursor-pointer"
                onClick={() => navigate(`/portfolio/${categoryId}/${project.id}`)}
              >
                <Table.Cell>
                  {project.hero_image_url ? (
                    <img
                      src={project.hero_image_url}
                      alt={project.title_en}
                      className="h-12 w-16 rounded object-cover"
                    />
                  ) : (
                    <Text className="text-ui-fg-subtle">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell>{project.title_en}</Table.Cell>
                <Table.Cell dir="rtl">{project.title_ar}</Table.Cell>
                <Table.Cell>{project.location_en}</Table.Cell>
                <Table.Cell>{formatDate(project.project_date)}</Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={project.is_in_homepage}
                    onCheckedChange={() => handleToggleHomepage(project)}
                  />
                </Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <IconButton size="small" onClick={() => navigate(`/portfolio/${categoryId}/${project.id}`)}>
                      <PencilSquare />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(project.id)}>
                      <Trash />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {data?.projects?.length === 0 && (
          <div className="mt-4 text-center text-ui-fg-subtle">No projects found</div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Projects",
})

export default ProjectsListPage

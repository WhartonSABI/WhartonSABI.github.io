#!/usr/bin/env Rscript

root <- normalizePath(getwd(), mustWork = TRUE)
default_project <- file.path(root, "..", "seminar", "projects", "abs")
project_dir <- Sys.getenv("ABS_PROJECT_DIR", unset = default_project)
project_dir <- normalizePath(project_dir, mustWork = TRUE)
generator <- file.path(project_dir, "scripts", "build_dashboard_assets.R")
output <- file.path(root, "public", "abs", "data.json")

if (!file.exists(generator)) stop("ABS dashboard generator not found: ", generator)
dir.create(dirname(output), recursive = TRUE, showWarnings = FALSE)

old_wd <- setwd(project_dir)
on.exit(setwd(old_wd), add = TRUE)

status <- system2(
  "Rscript",
  c(shQuote(generator), shQuote(output)),
  stdout = "",
  stderr = ""
)
if (!identical(status, 0L)) stop("ABS dashboard data generation failed")
message("Wrote ", output)

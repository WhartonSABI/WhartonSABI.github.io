#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(readr)
  library(dplyr)
  library(stringr)
  library(jsonlite)
  library(nnet)
})

root <- getwd()
source_data_dir <- file.path(root, "..", "seminar", "projects", "rugby-ep", "data")
out_dir <- file.path(root, "public", "rugby-ep")
out_file <- file.path(out_dir, "data.json")

phase_file <- file.path(source_data_dir, "phase_2018-19.csv")
kick_file <- file.path(source_data_dir, "Goal kicking data.csv")
bootstrap_file <- file.path(source_data_dir, "bootstrap.rds")

zone_names <- c(
  "5m-Goal (opp)",
  "22m-5m (opp)",
  "10m-22m (opp)",
  "Half-10m (opp)",
  "10m-Half (own)",
  "22m-10m (own)",
  "5m-22m (own)",
  "Goal-5m (own)"
)
zone_breaks <- c(0, 5, 22, 40, 50, 60, 78, 95, 100)

to_num <- function(x) {
  y <- suppressWarnings(as.numeric(x))
  ifelse(is.finite(y), y, NA_real_)
}

location_to_center <- c(
  "5m-Goal (opp)" = 5,
  "22m-5m (opp)" = 13.5,
  "10m-22m (opp)" = 31.0,
  "Half-10m (opp)" = 45.0,
  "10m-Half (own)" = 55.0,
  "22m-10m (own)" = 69.0,
  "5m-22m (own)" = 86.5,
  "Goal-5m (own)" = 97.5
)

phase_data <- read_csv(phase_file, show_col_types = FALSE) %>%
  mutate(
    outcome_points = str_extract(Outcome, "[-+]?\\d+") %>% to_num(),
    outcome_points = if_else(is.na(outcome_points), 0, outcome_points)
  )

# Team strengths
last_play <- phase_data %>%
  group_by(Round, Home, Away) %>%
  filter(ID == max(ID)) %>%
  ungroup() %>%
  mutate(
    score_change = outcome_points,
    final_points_difference = Points_Difference + score_change,
    final_diff_home = if_else(Team_In_Poss == "Home", final_points_difference, -final_points_difference)
  ) %>%
  select(Round, Home, Away, final_diff_home) %>%
  distinct()

team_results <- bind_rows(
  last_play %>%
    transmute(team = Home, win = if_else(final_diff_home > 0, 1, 0)),
  last_play %>%
    transmute(team = Away, win = if_else(final_diff_home < 0, 1, 0))
)

prior_games <- 2
team_strengths_df <- team_results %>%
  group_by(team) %>%
  summarise(
    wins = sum(win, na.rm = TRUE),
    games = n(),
    strength = (wins + 0.5 * prior_games) / (games + prior_games),
    .groups = "drop"
  ) %>%
  arrange(team)

team_strengths <- setNames(team_strengths_df$strength, team_strengths_df$team)

# Kick model + restart lookup
kick_data <- read_csv(kick_file, show_col_types = FALSE) %>%
  filter(Type == 2) %>%
  transmute(
    x = to_num(`X1 Metres`),
    y = 100 - to_num(`Y1 Metres`),
    make = if_else(to_num(Quality) == 1, 1, 0)
  ) %>%
  filter(is.finite(x), is.finite(y), is.finite(make))

kick_data <- kick_data %>%
  mutate(
    angle = atan2(abs(x - 35), y) * (180 / pi),
    distance = sqrt((x - 35)^2 + y^2)
  )

kick_model <- glm(make ~ angle + distance, family = binomial(link = "logit"), data = kick_data)
kick_coef <- as.numeric(coef(kick_model))
kick_vcov <- unname(vcov(kick_model))

phase_restarts <- phase_data %>%
  group_by(Round, Home, Away) %>%
  filter(Phase == 1) %>%
  arrange(ID, .by_group = TRUE) %>%
  mutate(
    points_diff_change = abs(Points_Difference) - abs(lag(Points_Difference)),
    is_first_row = row_number() == 1,
    is_second_half_start = Seconds_Remaining < 2400 & lag(Seconds_Remaining) >= 2400
  ) %>%
  filter(
    Play_Start == "Restart Kick",
    is.na(points_diff_change) | points_diff_change == 0,
    !is_first_row,
    !is.na(is_second_half_start) & !is_second_half_start
  ) %>%
  ungroup() %>%
  mutate(points = outcome_points)

miss_by_zone <- phase_restarts %>%
  group_by(Location) %>%
  summarise(
    n = n(),
    avg_ep = mean(points, na.rm = TRUE),
    .groups = "drop"
  )

miss_lookup <- tibble(
  location = zone_names,
  y_min = zone_breaks[-length(zone_breaks)],
  y_max = zone_breaks[-1]
) %>%
  left_join(
    miss_by_zone %>% transmute(location = Location, avg_ep = avg_ep),
    by = "location"
  ) %>%
  mutate(
    y_center = unname(location_to_center[location]),
    avg_ep = if_else(is.na(avg_ep), mean(phase_restarts$points, na.rm = TRUE), avg_ep)
  ) %>%
  arrange(y_center)

# Lineout model parameters and bootstrap coefficients
boot <- readRDS(bootstrap_file)
point_model <- boot$point_estimate_model
point_levels <- to_num(point_model$lev)

coef_point <- coef(point_model)
if (is.null(dim(coef_point))) {
  coef_point <- matrix(coef_point, nrow = 1)
}
coef_point <- unname(coef_point)
class_rows <- rownames(coef(point_model))
coef_names <- colnames(coef(point_model))

boot_coefs <- boot$bootstrap_coefficients
set.seed(20260504)
max_draws <- min(600L, length(boot_coefs))
draw_idx <- sort(sample.int(length(boot_coefs), max_draws, replace = FALSE))
boot_draws <- lapply(draw_idx, function(i) unname(boot_coefs[[i]]))

meter_levels <- c(5, 13.5, 31.0, 45.0, 55.0, 69.0, 86.5, 97.5)

payload <- list(
  generatedAt = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
  dataSource = list(
    phase = "seminar/projects/rugby-ep/data/phase_2018-19.csv",
    kick = "seminar/projects/rugby-ep/data/Goal kicking data.csv",
    bootstrap = "seminar/projects/rugby-ep/data/bootstrap.rds"
  ),
  defaults = list(
    attackTeam = if ("New Zealand" %in% names(team_strengths)) "New Zealand" else names(team_strengths)[1],
    defenseTeam = if ("South Africa" %in% names(team_strengths)) "South Africa" else names(team_strengths)[2],
    x = 35,
    y = 40,
    dTouch = 20,
    cardDiff = 0,
    lessThan2Min = 0
  ),
  controls = list(
    x = list(min = 0, max = 70, step = 1),
    y = list(min = 5, max = 95, step = 1),
    dTouch = list(min = 0, max = 30, step = 1),
    cardDiff = list(min = -2, max = 2, step = 1)
  ),
  teams = lapply(seq_len(nrow(team_strengths_df)), function(i) {
    list(name = team_strengths_df$team[i], strength = unname(team_strengths_df$strength[i]))
  }),
  lineout = list(
    pointLevels = unname(point_levels),
    classRows = unname(class_rows),
    coefNames = unname(coef_names),
    meterLevels = meter_levels,
    coefPoint = coef_point,
    coefBootstrap = boot_draws
  ),
  kick = list(
    coef = unname(kick_coef),
    vcov = unname(kick_vcov),
    missLookup = lapply(seq_len(nrow(miss_lookup)), function(i) {
      list(
        location = miss_lookup$location[i],
        yMin = miss_lookup$y_min[i],
        yMax = miss_lookup$y_max[i],
        yCenter = miss_lookup$y_center[i],
        avgEp = miss_lookup$avg_ep[i]
      )
    }),
    missOverall = mean(phase_restarts$points, na.rm = TRUE)
  )
)

if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)
writeLines(
  toJSON(payload, auto_unbox = TRUE, digits = 8, pretty = FALSE),
  out_file,
  useBytes = TRUE
)

message("Wrote ", out_file)

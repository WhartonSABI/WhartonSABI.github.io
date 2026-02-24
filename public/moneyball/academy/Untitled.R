library(tidyverse)
library(ggplot2)

diving <- read.csv('data/diving.csv')

diving_hist <- ggplot(data = diving)

diving_hist <- 
  diving_hist +
  geom_histogram(aes(x = JScore), binwidth = .25)

diving_hist

diving_hist <- diving_hist +
  facet_wrap("JCountry", nrow = 3)

diving_hist

median_score <- diving %>% 
  reframe(med = median(JScore)) %>% 
  pull(med)

median_score = median(diving$JScore)
  
diving_hist <- 
  diving_hist + 
  geom_vline(xintercept = median_score, color = 'lightcoral')

diving_hist

diving_box <- ggplot(data = diving) +
  geom_boxplot(aes(x = Round, y = JScore, fill = Round)) + 
  labs(title = "Judge Scores per Round", x= "")

diving_box

diving_violin <- ggplot(data = diving) +
  geom_violin(aes(x = Round, y = JScore, fill = Round)) + 
  labs(title = "Judge Scores per Round", x= "") + 
  theme_minimal()

diving_violin

bar <- ggplot(data = diving) +
  geom_bar(aes(x = JCountry, fill = JCountry)) + 
  labs(x = 'Judge Country') +
  theme_minimal() + 
  theme(legend.position = 'none') + 
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

bar

#scatter plots
head(diving)
scatter_raw = ggplot(data = diving)+
  geom_point(aes(x=Rank, y = JScore, color = Country)) + 
  labs(x = "Diver Rank", y = "Judge Score") + 
  theme_minimal()

scatter_raw

diving_grouped <- diving %>% 
  group_by(Diver) %>% 
  reframe(JScore_mean = mean(JScore),
          Rank_mean = mean(Rank),
          Difficulty_mean = mean(Difficulty),
          Country = first(Country))

head(diving_grouped)

scatter = ggplot(data = diving_grouped)+
  geom_point(aes(x=Rank_mean, y = JScore_mean, color = Country)) + 
  labs(x = "Diver Rank", y = "Judge Score") + 
  theme_minimal()

scatter

#lines
scatter <- scatter + 
  geom_abline(intercept = 8.5, slope= -0.1, color = 'lightcoral')
scatter

scatter <- ggplot(data = diving_grouped) +
  geom_point(aes(x=Rank_mean, y = JScore_mean, color = Difficulty_mean)) + 
  scale_color_distiller(palette = "OrRd", direction = 1)
scatter

#stat_ 
judges <- ggplot(data = diving, aes(x = Judge, y = JScore)) + 
  stat_summary(fun.data = mean_se)+
  labs(y = "Judge Score") +
  coord_flip()

judges

hist <- ggplot(data = diving) + 
  geom_bin2d(aes(x = Rank, y = Difficulty), bins = 10)+
  scale_fill_distiller(palette = "Spectral")

hist  
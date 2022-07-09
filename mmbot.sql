-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Gazdă: 127.0.0.1
-- Timp de generare: iul. 09, 2022 la 04:01 PM
-- Versiune server: 10.4.24-MariaDB
-- Versiune PHP: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Bază de date: `mmbot`
--

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `defeans`
--

CREATE TABLE `defeans` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `defean_time` varchar(255) NOT NULL,
  `defean_reason` varchar(255) NOT NULL,
  `defean_date` varchar(255) NOT NULL,
  `guild_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `giveaways`
--

CREATE TABLE `giveaways` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(20) NOT NULL,
  `creator` varchar(20) NOT NULL,
  `channel_id` varchar(20) NOT NULL,
  `message_id` varchar(20) NOT NULL,
  `prize` varchar(255) NOT NULL,
  `expiration` bigint(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `guilds_settings`
--

CREATE TABLE `guilds_settings` (
  `guild_id` varchar(20) NOT NULL,
  `anti_ban` int(11) NOT NULL DEFAULT 0,
  `anti_kick` int(11) NOT NULL DEFAULT 0,
  `anti_roledelete` int(11) NOT NULL DEFAULT 0,
  `anti_mention` int(11) NOT NULL DEFAULT 0,
  `anti_channelcreate` int(11) NOT NULL DEFAULT 0,
  `anti_channeldelete` int(11) NOT NULL DEFAULT 0,
  `anti_roleupdate` int(11) NOT NULL DEFAULT 0,
  `spam_default_mute_minutes` int(11) NOT NULL DEFAULT 5,
  `anti_spam` int(11) NOT NULL DEFAULT 0,
  `anti_invitelink` int(11) NOT NULL DEFAULT 0,
  `anti_roleadd` int(11) NOT NULL DEFAULT 0,
  `server_stats` varchar(20) NOT NULL DEFAULT '0',
  `role_counter` varchar(20) NOT NULL DEFAULT '0',
  `welcome_channel` varchar(20) NOT NULL DEFAULT '0',
  `ytb_announce_channel` varchar(20) NOT NULL DEFAULT '0',
  `birthday_announce_channel` varchar(20) NOT NULL DEFAULT '0',
  `auto_role` varchar(20) NOT NULL DEFAULT '0',
  `total_members_joined` int(11) NOT NULL DEFAULT 0,
  `total_members_left` int(11) NOT NULL DEFAULT 0,
  `prefix` varchar(21) CHARACTER SET utf8 NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `guild_youtube_announces`
--

CREATE TABLE `guild_youtube_announces` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(20) NOT NULL,
  `youtube_channel_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `guild_youtube_video_links`
--

CREATE TABLE `guild_youtube_video_links` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(20) NOT NULL,
  `video_id` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `invite_links`
--

CREATE TABLE `invite_links` (
  `ID` int(11) NOT NULL,
  `invite_link` varchar(255) NOT NULL,
  `joined` bigint(255) NOT NULL,
  `leaved` bigint(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `mutes`
--

CREATE TABLE `mutes` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `mute_time` bigint(255) NOT NULL,
  `mute_date` varchar(255) NOT NULL,
  `mute_reason` varchar(255) NOT NULL,
  `mute_guild` varchar(20) NOT NULL,
  `last_rank_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `role_counter`
--

CREATE TABLE `role_counter` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(20) NOT NULL,
  `role_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `saved_queue`
--

CREATE TABLE `saved_queue` (
  `user_id` varchar(21) CHARACTER SET utf8 NOT NULL,
  `category` varchar(64) CHARACTER SET utf16 NOT NULL,
  `object` varchar(128) CHARACTER SET utf32 NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `self_roles`
--

CREATE TABLE `self_roles` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(20) NOT NULL,
  `channel_id` varchar(20) NOT NULL,
  `message_id` varchar(20) NOT NULL,
  `role_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `settings`
--

CREATE TABLE `settings` (
  `last_ssh_login_ip` varchar(15) NOT NULL DEFAULT '0',
  `maintenance_mode` varchar(8) CHARACTER SET utf8 NOT NULL,
  `maintenance_reason` varchar(128) CHARACTER SET utf32 NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `ticket_guilds`
--

CREATE TABLE `ticket_guilds` (
  `guild_id` varchar(21) CHARACTER SET utf8 NOT NULL,
  `channel_id` varchar(21) CHARACTER SET utf8 NOT NULL,
  `message_id` varchar(21) CHARACTER SET utf8 NOT NULL,
  `message` varchar(48) CHARACTER SET utf8 NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `coins` int(11) NOT NULL DEFAULT 0,
  `coins_in_bank` int(11) NOT NULL DEFAULT 0,
  `daily` int(11) NOT NULL DEFAULT 0,
  `birthday_day` int(11) NOT NULL DEFAULT 0,
  `birthday_month` int(11) NOT NULL DEFAULT 0,
  `birthday_year` int(11) NOT NULL DEFAULT 0,
  `birthday_announced` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `users_data`
--

CREATE TABLE `users_data` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(20) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `total_invites` int(11) NOT NULL DEFAULT 0,
  `invited_by` varchar(20) NOT NULL DEFAULT '0',
  `success_invites` int(11) NOT NULL DEFAULT 0,
  `total_voice_seconds` int(11) NOT NULL DEFAULT 0,
  `total_message_send` int(11) NOT NULL DEFAULT 0,
  `xp` int(11) NOT NULL DEFAULT 0,
  `level` int(11) NOT NULL DEFAULT 0,
  `warns` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `voice_mute`
--

CREATE TABLE `voice_mute` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `guild_id` varchar(20) NOT NULL,
  `mute_time` bigint(255) NOT NULL,
  `mute_reason` varchar(255) NOT NULL,
  `mute_date` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structură tabel pentru tabel `youtube_playlist`
--

CREATE TABLE `youtube_playlist` (
  `user_id` varchar(21) CHARACTER SET utf8 NOT NULL,
  `url` varchar(128) CHARACTER SET utf16 NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexuri pentru tabele eliminate
--

--
-- Indexuri pentru tabele `defeans`
--
ALTER TABLE `defeans`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `giveaways`
--
ALTER TABLE `giveaways`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `guilds_settings`
--
ALTER TABLE `guilds_settings`
  ADD PRIMARY KEY (`guild_id`);

--
-- Indexuri pentru tabele `guild_youtube_announces`
--
ALTER TABLE `guild_youtube_announces`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `guild_youtube_video_links`
--
ALTER TABLE `guild_youtube_video_links`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `invite_links`
--
ALTER TABLE `invite_links`
  ADD PRIMARY KEY (`ID`);

--
-- Indexuri pentru tabele `mutes`
--
ALTER TABLE `mutes`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `role_counter`
--
ALTER TABLE `role_counter`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `self_roles`
--
ALTER TABLE `self_roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `users_data`
--
ALTER TABLE `users_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexuri pentru tabele `voice_mute`
--
ALTER TABLE `voice_mute`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pentru tabele eliminate
--

--
-- AUTO_INCREMENT pentru tabele `defeans`
--
ALTER TABLE `defeans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `giveaways`
--
ALTER TABLE `giveaways`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `guild_youtube_announces`
--
ALTER TABLE `guild_youtube_announces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `guild_youtube_video_links`
--
ALTER TABLE `guild_youtube_video_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `invite_links`
--
ALTER TABLE `invite_links`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `mutes`
--
ALTER TABLE `mutes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `role_counter`
--
ALTER TABLE `role_counter`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `self_roles`
--
ALTER TABLE `self_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `users_data`
--
ALTER TABLE `users_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pentru tabele `voice_mute`
--
ALTER TABLE `voice_mute`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

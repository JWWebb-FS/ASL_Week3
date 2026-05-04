# Star Tracker API

## Overview
This project is a RESTful API built using **Node.js**, **Express**, and **Sequelize ORM**.  
The API is designed to store and manage information about celestial objects:

- Galaxies
- Stars
- Planets

It supports full CRUD operations and demonstrates relational database concepts, including a many-to-many relationship.

## Features
- CRUD operations
- Image uploads (multer)
- HTML + JSON responses
- Express + Sequelize + SQLite
---

## Technologies Used
- Node.js
- Express
- Sequelize ORM
- SQLite

---

## Database Structure

### Galaxy
- name (string)
- size (integer)
- description (text)

### Star
- name (string)
- size (integer)
- description (text)
- belongs to Galaxy

### Planet
- name (string)
- size (integer)
- description (text)
- belongs to many Stars

### Relationships
- A **Galaxy has many Stars**
- A **Star belongs to a Galaxy**
- A **Star has many Planets**
- A **Planet belongs to many Stars**

A join table called **StarsPlanets** is used to manage the many-to-many relationship between Stars and Planets.

---

## API Endpoints

### Galaxies
- `GET /galaxies` – Get all galaxies
- `GET /galaxies/:id` – Get a single galaxy
- `POST /galaxies` – Create a galaxy
- `PUT /galaxies/:id` – Update a galaxy
- `DELETE /galaxies/:id` – Delete a galaxy

---

### Stars
- `GET /stars` – Get all stars
- `GET /stars/:id` – Get a single star
- `POST /stars` – Create a star
- `PUT /stars/:id` – Update a star
- `DELETE /stars/:id` – Delete a star

---

### Planets
- `GET /planets` – Get all planets
- `GET /planets/:id` – Get a single planet
- `POST /planets` – Create a planet
- `PUT /planets/:id` – Update a planet
- `DELETE /planets/:id` – Delete a planet

---

### Relationships (Many-to-Many)
- `POST /stars/:starId/planets/:planetId`  
  Links a planet to a star using the join table.

---

## Running the Project

1. Install dependencies:
```bash
npm install
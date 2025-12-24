<script setup>
const users = [
  {
    name: 'Lindsay Walton',
    title: 'Front-end Developer',
    email: 'lindsay.walton@example.com',
    role: 'Member',
  },
  {
    name: 'Courtney Henry',
    title: 'Designer',
    email: 'courtney.henry@example.com',
    role: 'Admin',
  },
  {
    name: 'Tom Cook',
    title: 'Director of Product',
    email: 'tom.cook@example.com',
    role: 'Member',
  },
  {
    name: 'Whitney Francis',
    title: 'Copywriter',
    email: 'whitney.francis@example.com',
    role: 'Admin',
  },
  {
    name: 'Leonard Krasner',
    title: 'Senior Designer',
    email: 'leonard.krasner@example.com',
    role: 'Owner',
  },
  {
    name: 'Floyd Miles',
    title: 'Principal Designer',
    email: 'floyd.miles@example.com',
    role: 'Member',
  },
]
</script>

<template>
  <div class="bg-slate-900 rounded-xl shadow-xl p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-white">Users</h2>
        <p class="text-sm text-slate-400">
          A list of all the users in your account including their name, title, email and role.
        </p>
      </div>

      <button
        class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
      >
        Add user
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-700">
        <thead>
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-slate-300">
              Name
            </th>
            <th class="px-4 py-3 text-left text-sm font-medium text-slate-300">
              Title
            </th>
            <th class="px-4 py-3 text-left text-sm font-medium text-slate-300">
              Email
            </th>
            <th class="px-4 py-3 text-left text-sm font-medium text-slate-300">
              Role
            </th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-800">
          <tr
            v-for="user in users"
            :key="user.email"
            class="hover:bg-slate-800/50 transition"
          >
            <td class="px-4 py-4 text-sm font-medium text-white">
              {{ user.name }}
            </td>

            <td class="px-4 py-4 text-sm text-slate-300">
              {{ user.title }}
            </td>

            <td class="px-4 py-4 text-sm text-slate-400">
              {{ user.email }}
            </td>

            <td class="px-4 py-4 text-sm text-slate-300">
              {{ user.role }}
            </td>

            <td class="px-4 py-4 text-right text-sm">
              <a
                href="#"
                class="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Edit
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

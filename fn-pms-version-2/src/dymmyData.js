export const departments = [
    { id: "c4e87741-c8d1-40bb-a01a-1b093d91d9b1", name: "Development", issue_access : false },
    { id: "1b201948-b208-44e9-aef4-750200989c78", name: "Design", issue_access : false },
    { id: "1b201948-b208-44e9-aef4-750200989c79", name: "Testing", issue_access : true },
];


export const users = [
    {
        id: "key-cloak-id",
        name: "John Dev",
        departments: [departments[0]],
    },
    {
        id: "key-cloak-id-2",
        name: "Hound Tester",
        departments: [departments[2]],
    },
    {
        id: "key-cloak-id-3",
        name: "Joffery Dev Tes",
        departments: [departments[0], departments[2]],
    }
];

export const activeUser = users[2];
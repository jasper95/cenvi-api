module.exports = [
  {
    table_name: 'user',
    data: [
      {
        id: '4cf57f7b-f029-48fe-ba6a-96535d8d5fd7',
        created_date: '2019-08-25T14:29:17Z',
        updated_date: '2019-09-08T03:43:12Z',
        email: 'cenvi@mailinator.com',
        verified: true,
        avatar: '',
        first_name: 'Cenvi',
        last_name: 'Admin',
        role: 'ADMIN',
        business_unit_id: null,
        srmp_role: '',
        ormp_role: '',
        srmp_business_units: ['871637c4-5510-4500-8e78-984fce5001ff', '2184c63d-0f4f-4d68-aa76-4816a7e24b63'],
        orpm_business_units: []
      }
    ]
  },
  {
    table_name: 'user_auth',
    data: [
      {
        id: '3cb92377-4150-4144-ad1b-7557a8b3517a',
        created_date: '2019-08-25T14:30:08Z',
        updated_date: '2019-08-25T14:30:08Z',
        user_id: '4cf57f7b-f029-48fe-ba6a-96535d8d5fd7',
        password: '640f0dff3f9828ffe4441de0c0edfb8ca61b69a998dc6c0d22d7dbc3e8b3df8547acd23d28729dc7282f041da1df9a7dd723236d6715ed537d638e09ca4e25ab',
        salt: 'f5137d35bf001df3'
      }
    ]
  }
]

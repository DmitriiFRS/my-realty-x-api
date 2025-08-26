export const getEstatesSelect = {
  id: true,
  slug: true,
  description: true,
  area: true,
  price: true,
  primaryImageUrl: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
  currencyType: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  dealTerm: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  district: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  estateType: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
};

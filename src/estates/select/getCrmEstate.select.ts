export const getCrmEstateSelect = {
  id: true,
  slug: true,
  description: true,
  area: true,
  price: true,
  deposit: true,
  leaseTermUnit: true,
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
  status: {
    select: {
      id: true,
      status: true,
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
  city: {
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
  features: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  EstatePrimaryMedia: {
    select: {
      id: true,
    },
  },
};

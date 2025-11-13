function buildParams(filters = {}, order, limit) {
  const params = { ...filters };

  if (order) {
    const isDesc = String(order).startsWith('-');
    params.order_by = isDesc ? String(order).slice(1) : order;
    params.direction = isDesc ? 'desc' : 'asc';
  }

  if (typeof limit === 'number') {
    params.limit = limit;
  }

  return params;
}

function createEntitiesApi(http) {
  const list = (basePath, filters, order, limit) =>
    http
      .get(basePath, {
        params: buildParams(filters, order, limit),
      })
      .then((response) => response.data);

  const retrieve = (basePath, id) =>
    http.get(`${basePath}/${id}`).then((response) => response.data);

  const create = (basePath, payload) =>
    http.post(basePath, payload).then((response) => response.data);

  const update = (basePath, id, payload) =>
    http.put(`${basePath}/${id}`, payload).then((response) => response.data);

  const destroy = (basePath, id) =>
    http.delete(`${basePath}/${id}`).then((response) => response.data ?? true);

  const Venue = {
    list: (order, limit) => list('/venues', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/venues', filters, order, limit),
    show: (id) => retrieve('/venues', id),
    create: (payload) => create('/venues', payload),
    update: (id, payload) => update('/venues', id, payload),
    delete: (id) => destroy('/venues', id),
    approve: (id, payload) =>
      http.post(`/venues/${id}/approve`, payload).then((response) => response.data),
    reject: (id, payload) =>
      http.post(`/venues/${id}/reject`, payload).then((response) => response.data),
  };

  const ClassType = {
    list: (order, limit) => list('/class-types', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/class-types', filters, order, limit),
    show: (id) => retrieve('/class-types', id),
    create: (payload) => create('/class-types', payload),
    update: (id, payload) => update('/class-types', id, payload),
    delete: (id) => destroy('/class-types', id),
  };

  const Session = {
    list: (order, limit) => list('/sessions', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/sessions', filters, order, limit),
    show: (id) => retrieve('/sessions', id),
    create: (payload) => create('/sessions', payload),
    update: (id, payload) => update('/sessions', id, payload),
    delete: (id) => destroy('/sessions', id),
  };

  const Booking = {
    list: (order, limit) => list('/bookings', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/bookings', filters, order, limit),
    show: (id) => retrieve('/bookings', id),
    create: (payload) => create('/bookings', payload),
    update: (id, payload) => update('/bookings', id, payload),
    delete: (id) => destroy('/bookings', id),
  };

  const WaitlistEntry = {
    list: (order, limit) => list('/waitlist-entries', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/waitlist-entries', filters, order, limit),
    show: (id) => retrieve('/waitlist-entries', id),
    create: (payload) => create('/waitlist-entries', payload),
    update: (id, payload) => update('/waitlist-entries', id, payload),
    delete: (id) => destroy('/waitlist-entries', id),
  };

  const Package = {
    list: (order, limit) => list('/packages', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/packages', filters, order, limit),
    show: (id) => retrieve('/packages', id),
    create: (payload) => create('/packages', payload),
    update: (id, payload) => update('/packages', id, payload),
    delete: (id) => destroy('/packages', id),
  };

  const PackageOwnership = {
    list: (order, limit) => list('/package-ownerships', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/package-ownerships', filters, order, limit),
    show: (id) => retrieve('/package-ownerships', id),
    create: (payload) => create('/package-ownerships', payload),
    update: (id, payload) => update('/package-ownerships', id, payload),
    delete: (id) => destroy('/package-ownerships', id),
  };

  const PaymentMethod = {
    list: (order, limit) => list('/payment-methods', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/payment-methods', filters, order, limit),
    show: (id) => retrieve('/payment-methods', id),
    create: (payload) => create('/payment-methods', payload),
    update: (id, payload) => update('/payment-methods', id, payload),
    delete: (id) => destroy('/payment-methods', id),
  };

  const Payment = {
    list: (order, limit) => list('/payments', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/payments', filters, order, limit),
    show: (id) => retrieve('/payments', id),
    create: (payload) => create('/payments', payload),
    update: (id, payload) => update('/payments', id, payload),
    delete: (id) => destroy('/payments', id),
  };

  const Favorite = {
    list: (order, limit) => list('/favorites', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/favorites', filters, order, limit),
    show: (id) => retrieve('/favorites', id),
    create: (payload) => create('/favorites', payload),
    delete: (id) => destroy('/favorites', id),
  };

  const VenueInstructor = {
    list: (order, limit) => list('/instructors', {}, order, limit),
    filter: (filters = {}, order, limit) => list('/instructors', filters, order, limit),
    show: (id) => retrieve('/instructors', id),
    create: (payload) => create('/instructors', payload),
    update: (id, payload) => update('/instructors', id, payload),
    delete: (id) => destroy('/instructors', id),
  };

  return {
    Venue,
    ClassType,
    Session,
    Booking,
    WaitlistEntry,
    Package,
    PackageOwnership,
    PaymentMethod,
    Payment,
    Favorite,
    VenueInstructor,
  };
}

export { createEntitiesApi };

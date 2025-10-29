import { LocomotiveTransformer } from '../../transformers/LocomotiveTransformer.js';

describe('LocomotiveTransformer', () => {
  const sampleLocomotive = {
    _id: 'loco-001',
    reportingMarks: 'ELMR',
    reportingNumber: '003801',
    model: 'GP38-2',
    manufacturer: 'Atlas',
    isDCC: true,
    dccAddress: 3801,
    homeYard: 'yard-001',
    isInService: true,
    notes: 'Test locomotive'
  };

  const sampleDCLocomotive = {
    _id: 'loco-002',
    reportingMarks: 'ELMR',
    reportingNumber: '000901',
    model: 'GP9',
    manufacturer: 'Bachmann',
    isDCC: false,
    homeYard: 'yard-002',
    isInService: false,
    notes: ''
  };

  describe('transform() - Default View', () => {
    it('should transform locomotive with all fields', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(sampleLocomotive);

      expect(result).toBeDefined();
      expect(result.id).toBe('loco-001');
      expect(result.reportingMarks).toBe('ELMR');
      expect(result.reportingNumber).toBe('003801');
      expect(result.model).toBe('GP38-2');
      expect(result.manufacturer).toBe('Atlas');
      expect(result.isDCC).toBe(true);
      expect(result.dccAddress).toBe(3801);
      expect(result.dccAddressFormatted).toBe('3801');
      expect(result.homeYard).toBe('yard-001');
      expect(result.isInService).toBe(true);
      expect(result.notes).toBe('Test locomotive');
    });

    it('should format single-digit DCC address with leading zero', () => {
      const transformer = new LocomotiveTransformer();
      const loco = { ...sampleLocomotive, dccAddress: 3 };
      const result = transformer.transform(loco);

      expect(result.dccAddressFormatted).toBe('03');
    });

    it('should handle DC locomotive (no DCC address)', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(sampleDCLocomotive);

      expect(result.isDCC).toBe(false);
      expect(result.dccAddressFormatted).toBeNull();
    });

    it('should handle null locomotive', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(null);

      expect(result).toBeNull();
    });

    it('should handle undefined locomotive', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(undefined);

      expect(result).toBeNull();
    });

    it('should handle empty notes', () => {
      const transformer = new LocomotiveTransformer();
      const loco = { ...sampleLocomotive, notes: '' };
      const result = transformer.transform(loco);

      expect(result.notes).toBe('');
    });

    it('should handle missing notes field', () => {
      const transformer = new LocomotiveTransformer();
      const { notes, ...locoWithoutNotes } = sampleLocomotive;
      const result = transformer.transform(locoWithoutNotes);

      expect(result.notes).toBe('');
    });
  });

  describe('transform() - List View', () => {
    it('should transform for list view with minimal fields', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(sampleLocomotive, { view: 'list' });

      expect(result).toBeDefined();
      expect(result.id).toBe('loco-001');
      expect(result.reportingMarks).toBe('ELMR');
      expect(result.reportingNumber).toBe('003801');
      expect(result.model).toBe('GP38-2');
      expect(result.manufacturer).toBe('Atlas');
      expect(result.isDCC).toBe(true);
      expect(result.dccAddressFormatted).toBe('3801');
      expect(result.isInService).toBe(true);
      
      // Should not include notes in list view
      expect(result.notes).toBeUndefined();
      expect(result.homeYard).toBeUndefined();
    });
  });

  describe('transform() - Detail View', () => {
    it('should transform for detail view with computed fields', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(sampleLocomotive, { view: 'detail' });

      expect(result).toBeDefined();
      expect(result.id).toBe('loco-001');
      expect(result.fullDesignation).toBe('ELMR 003801');
      expect(result.displayName).toBe('ELMR 003801');
      expect(result.status).toBe('In Service');
      expect(result.dccStatus).toBe('DCC (3801)');
    });

    it('should show DC status for DC locomotives', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(sampleDCLocomotive, { view: 'detail' });

      expect(result.dccStatus).toBe('DC');
      expect(result.status).toBe('Out of Service');
    });

    it('should format DCC status with leading zero for single digit', () => {
      const transformer = new LocomotiveTransformer();
      const loco = { ...sampleLocomotive, dccAddress: 3 };
      const result = transformer.transform(loco, { view: 'detail' });

      expect(result.dccStatus).toBe('DCC (03)');
    });
  });

  describe('transform() - Export View', () => {
    it('should transform for export with flat structure', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(sampleLocomotive, { view: 'export' });

      expect(result).toBeDefined();
      expect(result['ID']).toBe('loco-001');
      expect(result['Reporting Marks']).toBe('ELMR');
      expect(result['Reporting Number']).toBe('003801');
      expect(result['Model']).toBe('GP38-2');
      expect(result['Manufacturer']).toBe('Atlas');
      expect(result['DCC Enabled']).toBe('Yes');
      expect(result['DCC Address']).toBe('3801');
      expect(result['Home Yard']).toBe('yard-001');
      expect(result['In Service']).toBe('Yes');
      expect(result['Notes']).toBe('Test locomotive');
    });

    it('should not include DCC address for DC locomotives', () => {
      const transformer = new LocomotiveTransformer();
      const result = transformer.transform(sampleDCLocomotive, { view: 'export' });

      expect(result['DCC Enabled']).toBe('No');
      expect(result['DCC Address']).toBeUndefined();
      expect(result['In Service']).toBe('No');
    });

    it('should not include notes if empty', () => {
      const transformer = new LocomotiveTransformer();
      const loco = { ...sampleLocomotive, notes: '' };
      const result = transformer.transform(loco, { view: 'export' });

      expect(result['Notes']).toBeUndefined();
    });
  });

  describe('buildFilterQuery()', () => {
    it('should build query for manufacturer filter', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ manufacturer: 'Atlas' });
      expect(query.manufacturer).toBe('Atlas');
    });

    it('should build query for model filter', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ model: 'GP38-2' });
      expect(query.model).toBe('GP38-2');
    });

    it('should build query for homeYard filter', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ homeYard: 'yard-001' });
      expect(query.homeYard).toBe('yard-001');
    });

    it('should build query for isInService filter (string true)', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ isInService: 'true' });
      expect(query.isInService).toBe(true);
    });

    it('should build query for isInService filter (boolean true)', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ isInService: true });
      expect(query.isInService).toBe(true);
    });

    it('should build query for isInService filter (string false)', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ isInService: 'false' });
      expect(query.isInService).toBe(false);
    });

    it('should build query for isDCC filter (string true)', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ isDCC: 'true' });
      expect(query.isDCC).toBe(true);
    });

    it('should build query for isDCC filter (boolean false)', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ isDCC: false });
      expect(query.isDCC).toBe(false);
    });

    it('should build search query for reporting marks', () => {
      const query = LocomotiveTransformer.buildFilterQuery({ search: 'ELMR' });
      expect(query.$or).toBeDefined();
      expect(query.$or).toHaveLength(3);
      expect(query.$or[0].reportingMarks).toBeDefined();
      expect(query.$or[1].reportingNumber).toBeDefined();
      expect(query.$or[2].model).toBeDefined();
    });

    it('should build combined filter query', () => {
      const query = LocomotiveTransformer.buildFilterQuery({
        manufacturer: 'Atlas',
        isInService: 'true',
        isDCC: true
      });
      expect(query.manufacturer).toBe('Atlas');
      expect(query.isInService).toBe(true);
      expect(query.isDCC).toBe(true);
    });

    it('should return empty query for no filters', () => {
      const query = LocomotiveTransformer.buildFilterQuery({});
      expect(Object.keys(query)).toHaveLength(0);
    });
  });

  describe('transformStatistics()', () => {
    const locomotives = [
      { ...sampleLocomotive, _id: 'loco-001', manufacturer: 'Atlas', model: 'GP38-2', isDCC: true, isInService: true, homeYard: 'yard-001' },
      { ...sampleDCLocomotive, _id: 'loco-002', manufacturer: 'Bachmann', model: 'GP9', isDCC: false, isInService: false, homeYard: 'yard-002' },
      { ...sampleLocomotive, _id: 'loco-003', manufacturer: 'Atlas', model: 'SD40-2', isDCC: true, isInService: true, homeYard: 'yard-001' },
      { ...sampleLocomotive, _id: 'loco-004', manufacturer: 'Kato', model: 'GP38-2', isDCC: true, isInService: true, homeYard: 'yard-003' }
    ];

    it('should calculate total counts', () => {
      const stats = LocomotiveTransformer.transformStatistics(locomotives);
      expect(stats.total).toBe(4);
      expect(stats.inService).toBe(3);
      expect(stats.outOfService).toBe(1);
      expect(stats.dccEnabled).toBe(3);
      expect(stats.dcOnly).toBe(1);
    });

    it('should calculate by manufacturer', () => {
      const stats = LocomotiveTransformer.transformStatistics(locomotives);
      expect(stats.byManufacturer['Atlas']).toBe(2);
      expect(stats.byManufacturer['Bachmann']).toBe(1);
      expect(stats.byManufacturer['Kato']).toBe(1);
    });

    it('should calculate by model', () => {
      const stats = LocomotiveTransformer.transformStatistics(locomotives);
      expect(stats.byModel['GP38-2']).toBe(2);
      expect(stats.byModel['GP9']).toBe(1);
      expect(stats.byModel['SD40-2']).toBe(1);
    });

    it('should calculate by home yard', () => {
      const stats = LocomotiveTransformer.transformStatistics(locomotives);
      expect(stats.byHomeYard['yard-001']).toBe(2);
      expect(stats.byHomeYard['yard-002']).toBe(1);
      expect(stats.byHomeYard['yard-003']).toBe(1);
    });

    it('should calculate availability rate', () => {
      const stats = LocomotiveTransformer.transformStatistics(locomotives);
      expect(stats.availabilityRate).toBe('75.0%');
    });

    it('should calculate DCC rate', () => {
      const stats = LocomotiveTransformer.transformStatistics(locomotives);
      expect(stats.dccRate).toBe('75.0%');
    });

    it('should handle empty array', () => {
      const stats = LocomotiveTransformer.transformStatistics([]);
      expect(stats.total).toBe(0);
      expect(stats.inService).toBe(0);
      expect(stats.outOfService).toBe(0);
      expect(stats.availabilityRate).toBe('0%');
      expect(stats.dccRate).toBe('0%');
    });

    it('should handle locomotives without home yard', () => {
      const locos = [{ ...sampleLocomotive, homeYard: null }];
      const stats = LocomotiveTransformer.transformStatistics(locos);
      expect(Object.keys(stats.byHomeYard)).toHaveLength(0);
    });
  });
});

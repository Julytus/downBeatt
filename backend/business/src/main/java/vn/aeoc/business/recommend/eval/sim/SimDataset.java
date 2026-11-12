package vn.aeoc.business.recommend.eval.sim;

import vn.aeoc.entity.data.mysql.lut.Lut;

import java.util.List;

public record SimDataset(
        List<Lut> luts,
        List<SimUser> users,
        List<SimEvent> events
) {}
